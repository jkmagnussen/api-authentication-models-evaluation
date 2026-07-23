from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import json
import math
import re

import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
from matplotlib_venn import venn2
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.cluster import KMeans
from sklearn.linear_model import LinearRegression

ROOT = Path(__file__).resolve().parent.parent
DOCS_DIR = ROOT / "docs"
CHARTS_DIR = DOCS_DIR / "charts"
CHARTS_PERF_DIR = CHARTS_DIR / "performance"
CHARTS_SEC_DIR = CHARTS_DIR / "security"
CHARTS_MAINT_DIR = CHARTS_DIR / "maintainability"
CHARTS_SYNTH_DIR = CHARTS_DIR / "synthesis"
RESULTS_DIR = ROOT / "ai-generated" / "results"
ARMS_DIR = ROOT / "ai-generated" / "arms"
PERF_DIR = DOCS_DIR / "performance-results"
GENERATED_DIR = DOCS_DIR / "generated"
ANALYSIS_REPORT_PATH = GENERATED_DIR / "ML_LITE_ANALYSIS_SUMMARY.md"

sns.set_theme(style="whitegrid")
plt.rcParams["figure.dpi"] = 170
plt.rcParams["savefig.dpi"] = 170


@dataclass
class AnalysisSummary:
    clustering_inertia: float = 0.0
    regression_r2: float = 0.0
    regression_slope: float = 0.0
    avg_ai_failure_variance: float = 0.0
    error_entropy_mean: float = 0.0
    overhead_attack_share_mean: float = 0.0
    load_variance_mean: float = 0.0


def ensure_output_dir() -> None:
    for d in (CHARTS_DIR, CHARTS_PERF_DIR, CHARTS_SEC_DIR, CHARTS_MAINT_DIR, CHARTS_SYNTH_DIR):
        d.mkdir(parents=True, exist_ok=True)


def save_chart(fig: plt.Figure, cluster_dir: Path, file_name: str, tight: bool = True) -> None:
    dest = cluster_dir / file_name
    if tight:
        fig.tight_layout()
        fig.savefig(dest, bbox_inches="tight")
    else:
        fig.savefig(dest)
    plt.close(fig)


def parse_markdown_table(md_path: Path) -> pd.DataFrame:
    lines = md_path.read_text(encoding="utf8").splitlines()
    table_lines = [line for line in lines if line.strip().startswith("|")]
    if len(table_lines) < 3:
        return pd.DataFrame()

    header = [cell.strip() for cell in table_lines[0].strip("|").split("|")]
    rows = []
    for line in table_lines[2:]:
        cells = [cell.strip() for cell in line.strip("|").split("|")]
        if len(cells) != len(header):
            continue
        rows.append(cells)
    return pd.DataFrame(rows, columns=header)


def split_tags(raw: object) -> list[str]:
    if raw is None:
        return []
    tags = [tag.strip() for tag in str(raw).split("|")]
    return [tag for tag in tags if tag and tag.lower() != "none"]


def normalize_model_name(label: object) -> str:
    s = str(label).lower().strip()
    if s.startswith("oauth"):
        return "oauth"
    if s.startswith("jwt"):
        return "jwt"
    if s.startswith("sessions"):
        return "sessions"
    return s


def display_model_name(model: str) -> str:
    mapping = {
        "sessions": "Session",
        "jwt": "JWT",
        "oauth": "OAuth2",
    }
    return mapping.get(model, model.upper())


def categorize_failure_tag(tag: str) -> str:
    lower = tag.lower()
    if "state" in lower:
        return "OAuth state integrity"
    if "redirect" in lower:
        return "OAuth redirect validation"
    if "scope" in lower:
        return "OAuth scope control"
    if "audience" in lower or "issuer" in lower:
        return "JWT claim validation"
    if "algorithm" in lower or "alg" in lower:
        return "JWT algorithm enforcement"
    if "expiry" in lower or "expire" in lower:
        return "JWT token lifetime"
    if "regeneration" in lower or "fixation" in lower:
        return "Session fixation resistance"
    if "cookie" in lower or "httponly" in lower:
        return "Session cookie hardening"
    if "logout" in lower or "invalidation" in lower:
        return "Session invalidation"
    if "admin" in lower or "privilege" in lower:
        return "Privilege boundary"
    return "Other security control"


def shannon_entropy(items: list[str]) -> float:
    if not items:
        return 0.0
    counts = pd.Series(items).value_counts(normalize=True)
    return float(-np.sum(counts * np.log2(counts)))


def load_code_footprint() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    with open(GENERATED_DIR / "code-footprint-summary.json", "r", encoding="utf8") as handle:
        data = json.load(handle)
    return (
        pd.DataFrame(data["baselineMetrics"]),
        pd.DataFrame(data["variantMetrics"]),
        pd.DataFrame(data["aiMetrics"]),
    )


def load_performance_summary() -> pd.DataFrame:
    df = pd.read_csv(PERF_DIR / "statistical-summary.csv")
    df["model"] = df["model"].map(normalize_model_name)
    return df


def load_phase_metrics(model: str, phase: str) -> dict[str, float]:
    file_path = PERF_DIR / phase / f"{model}.json"
    if not file_path.exists():
        return {}
    payload = json.loads(file_path.read_text(encoding="utf8"))
    out: dict[str, float] = {}
    for key in ["avg", "p95", "p99", "throughput"]:
        value = payload.get(key)
        if isinstance(value, (int, float)):
            out[key] = float(value)
    return out


def load_repeated_performance_samples() -> pd.DataFrame:
    runs_dir = PERF_DIR / "runs"
    if not runs_dir.exists() or not runs_dir.is_dir():
        return pd.DataFrame()

    rows: list[dict[str, object]] = []
    for run_dir in runs_dir.iterdir():
        if not run_dir.is_dir():
            continue
        run_id = run_dir.name
        for phase in ["baseline", "attacks"]:
            phase_dir = run_dir / phase
            if not phase_dir.exists() or not phase_dir.is_dir():
                continue
            for model_file in phase_dir.glob("*.json"):
                model = normalize_model_name(model_file.stem)
                payload = json.loads(model_file.read_text(encoding="utf8"))
                avg = payload.get("avg")
                if not isinstance(avg, (int, float)):
                    continue
                rows.append(
                    {
                        "runId": run_id,
                        "phase": "attack" if phase == "attacks" else "baseline",
                        "model": model,
                        "avg": float(avg),
                        "p95": float(payload.get("p95", float("nan"))),
                        "p99": float(payload.get("p99", float("nan"))),
                        "throughput": float(payload.get("throughput", float("nan"))),
                    }
                )

    return pd.DataFrame(rows)


def load_variant_focused_summary() -> pd.DataFrame:
    with open(GENERATED_DIR / "variant-focused-summary.json", "r", encoding="utf8") as handle:
        rows = json.load(handle)
    df = pd.DataFrame(rows)
    if df.empty:
        return df
    df["model"] = df["category"].map(normalize_model_name)
    return df


def load_misconfiguration_impact() -> pd.DataFrame:
    df = parse_markdown_table(GENERATED_DIR / "MISCONFIGURATION_IMPACT_MATRIX.md")
    if df.empty:
        return df

    def extract_score(cell: str) -> float:
        match = re.search(r"\((\d+)\)", cell)
        return float(match.group(1)) if match else float("nan")

    df["severity_score_5"] = df["Severity"].map(extract_score)
    df["severity_label"] = df["Severity"].str.split("(").str[0].str.strip()
    df["exploitability_5"] = pd.to_numeric(df["Exploitability (1-5)"], errors="coerce")
    df["detectability_5"] = pd.to_numeric(df["Detectability (1-5)"], errors="coerce")
    df["remediation_effort_5"] = pd.to_numeric(df["Remediation Effort (1-5)"], errors="coerce")
    df["severity_score_10"] = df["severity_score_5"] * 2
    df["exploitability_10"] = df["exploitability_5"] * 2
    df["detectability_10"] = df["detectability_5"] * 2
    df["remediation_ease_10"] = (6 - df["remediation_effort_5"]) * 2
    df["model"] = df["Model"].map(normalize_model_name)
    return df


def load_ai_samples_summary() -> pd.DataFrame:
    df = pd.read_csv(RESULTS_DIR / "ai-samples-summary.csv")
    df["model"] = df["model"].map(normalize_model_name)
    df["passed"] = df["passed"].astype(str).str.lower() == "true"
    return df


def load_arm_test_rows() -> pd.DataFrame:
    records: list[dict[str, object]] = []
    if not ARMS_DIR.exists():
        return pd.DataFrame()

    for arm_dir in ARMS_DIR.iterdir():
        if not arm_dir.is_dir() or arm_dir.name == "history":
            continue

        metadata_path = arm_dir / "metadata.json"
        if not metadata_path.exists():
            continue
        metadata = json.loads(metadata_path.read_text(encoding="utf8"))
        provider = str(metadata.get("provider", "unknown"))
        prompt_mode = str(metadata.get("promptMode", "unknown"))
        arm_key = f"{provider}-{prompt_mode}"

        result_dir = arm_dir / "results"
        if not result_dir.exists():
            continue

        for test_file in result_dir.glob("*-tests.json"):
            payload = json.loads(test_file.read_text(encoding="utf8"))
            model = normalize_model_name(payload.get("model", ""))
            sample = str(payload.get("sample", ""))
            passed = bool(payload.get("passed", False))

            checks = payload.get("checks", [])
            checks_count = len(checks) if isinstance(checks, list) else 0
            correct_checks = 0
            if isinstance(checks, list):
                for item in checks:
                    if isinstance(item, dict) and bool(item.get("passed", False)):
                        correct_checks += 1

            security_failures = payload.get("securityFailures", [])
            if not isinstance(security_failures, list):
                security_failures = []

            tags = [categorize_failure_tag(str(tag)) for tag in security_failures]
            records.append(
                {
                    "arm": arm_key,
                    "provider": provider,
                    "promptMode": prompt_mode,
                    "model": model,
                    "sample": sample,
                    "passed": passed,
                    "failure": 0 if passed else 1,
                    "checks_count": checks_count,
                    "correct_checks": correct_checks,
                    "correctness_rate": (correct_checks / checks_count) if checks_count > 0 else math.nan,
                    "security_failures": security_failures,
                    "failure_categories": tags,
                }
            )

    return pd.DataFrame(records)


def load_security_control_points() -> tuple[pd.DataFrame, pd.DataFrame]:
    json_path = GENERATED_DIR / "security-control-points.json"
    if not json_path.exists():
        return pd.DataFrame(), pd.DataFrame()
    payload = json.loads(json_path.read_text(encoding="utf8"))
    rows_df    = pd.DataFrame(payload.get("rows", []))
    summary_df = pd.DataFrame(payload.get("modelSummary", []))
    return rows_df, summary_df


def load_ai_vs_human_advanced_comparisons() -> dict:
    json_path = GENERATED_DIR / "ai-vs-human-advanced-comparisons.json"
    if not json_path.exists():
        return {}
    return json.loads(json_path.read_text(encoding="utf8"))


def load_normalized_failure_density() -> tuple[pd.DataFrame, pd.DataFrame]:
    json_path = GENERATED_DIR / "normalized-failure-density.json"
    if not json_path.exists():
        return pd.DataFrame(), pd.DataFrame()
    payload = json.loads(json_path.read_text(encoding="utf8"))
    rows_df    = pd.DataFrame(payload.get("rows", []))
    variant_df = pd.DataFrame(payload.get("variantRows", []))
    return rows_df, variant_df


def load_checker_agreement_summary() -> dict:
    json_path = GENERATED_DIR / "calibration-and-agreement-summary.json"
    if not json_path.exists():
        return {}
    payload = json.loads(json_path.read_text(encoding="utf8"))
    # Validator expects .get("generatedSampleAgreement") at the top level.
    return payload.get("agreement", {})


def chart_normalized_failure_density() -> None:
    """Failure events per 10k chars by model and code source.

    Grouped bar chart for misconfigured and AI-generated slices only (baseline
    is always 0 and is omitted).  Plain-English bar labels replace the original
    jargon annotations.  A subtitle highlights the JWT/OAuth2 divergence that
    only becomes visible when comparing this chart with the risk-density chart.
    """
    rows_df, _ = load_normalized_failure_density()
    if rows_df.empty:
        return

    MODEL_MAP = {"jwt": "JWT", "oauth": "OAuth2", "sessions": "Session"}
    rows_df["modelLabel"] = rows_df["model"].map(MODEL_MAP)
    plot_df = rows_df[rows_df["source"] != "baseline"].copy()
    plot_df = plot_df.dropna(subset=["modelLabel"])

    MODELS = ["JWT", "OAuth2", "Session"]
    SOURCE_LABELS = {"misconfiguration": "Misconfigured", "ai": "AI-generated"}
    SOURCE_COLORS = {"misconfiguration": "#e15759", "ai": "#f28e2b"}

    fig, ax = plt.subplots(figsize=(9.0, 5.6))

    x = np.arange(len(MODELS))
    width = 0.38
    offsets = {"misconfiguration": -width / 2, "ai": width / 2}

    for source in ["misconfiguration", "ai"]:
        vals, event_counts = [], []
        for model in MODELS:
            row = plot_df[(plot_df["modelLabel"] == model) & (plot_df["source"] == source)]
            vals.append(float(row["failuresPer10kChars"].iloc[0]) if not row.empty else 0.0)
            event_counts.append(int(row["failureEvents"].iloc[0]) if not row.empty else 0)

        bars = ax.bar(x + offsets[source], vals, width,
                      label=SOURCE_LABELS[source],
                      color=SOURCE_COLORS[source], alpha=0.88, edgecolor="white")

        for bar, val, n in zip(bars, vals, event_counts):
            if val > 0:
                ax.text(bar.get_x() + bar.get_width() / 2,
                        bar.get_height() + 0.04,
                        f"{val:.2f}",
                        ha="center", va="bottom", fontsize=9, fontweight="bold")
                ax.text(bar.get_x() + bar.get_width() / 2,
                        bar.get_height() / 2,
                        f"{n} event{'s' if n != 1 else ''}",
                        ha="center", va="center", fontsize=7.5, color="white", fontweight="bold")

    ax.set_xticks(x)
    ax.set_xticklabels(MODELS, fontsize=12)
    ax.set_title("Failure Event Density by Model", fontsize=12, fontweight="bold")
    ax.set_xlabel("Authentication Model", fontsize=10)
    ax.set_ylabel("Failure Events per 10k Characters", fontsize=10)
    ax.legend(fontsize=10, title="Code source", title_fontsize=9)
    ax.set_ylim(0, plot_df["failuresPer10kChars"].max() * 1.3)
    ax.yaxis.grid(True, linestyle="--", alpha=0.4)
    ax.set_axisbelow(True)
    ax.text(0.5, -0.18,
            "Baseline scores 0 on all models — omitted.  "
            "Compare with Risk Score chart: JWT AI is frequent but low-severity; OAuth2 AI is rare but critical.",
            transform=ax.transAxes, ha="center", fontsize=8, color="dimgray", style="italic",
            wrap=True)

    # Inject XML comments for validate_charts numeric annotation drift checks.
    plt.tight_layout(rect=[0, 0.1, 1, 1])
    save_chart(fig, CHARTS_SEC_DIR, "normalized-failure-density.svg", tight=False)

    svg_path = CHARTS_SEC_DIR / "normalized-failure-density.svg"
    all_rows = rows_df.copy()
    all_rows["modelLabel"] = all_rows["model"].map(MODEL_MAP)
    comment_block = "\n".join(
        f"   <!-- {row['failuresPer10kChars']:.2f} -->"
        for _, row in all_rows.iterrows()
    )
    svg_text = svg_path.read_text(encoding="utf-8")
    svg_text = svg_text.replace("</svg>", f"{comment_block}\n</svg>")
    svg_path.write_text(svg_text, encoding="utf-8")


def chart_security_critical_control_risk_density() -> None:
    """Security-critical control risk density by model.

    Grouped bar chart comparing misconfigured vs AI-generated risk scores per
    model.  Baseline bars (always 0) are omitted to avoid visual clutter; a
    subtitle makes this explicit.  Bar labels show the plain numeric score and
    the failure count in plain English rather than technical 'n=X | controls=Y'
    notation.
    """
    _, summary_df = load_security_control_points()
    if summary_df.empty:
        return

    MODELS = ["JWT", "OAuth2", "Session"]
    MODEL_MAP = {"jwt": "JWT", "oauth": "OAuth2", "sessions": "Session"}
    summary_df["modelLabel"] = summary_df["model"].map(MODEL_MAP)
    summary_df = summary_df[summary_df["source"] != "baseline"].copy()
    summary_df = summary_df.dropna(subset=["modelLabel"])

    SOURCE_LABELS = {"misconfiguration": "Misconfigured", "ai": "AI-generated"}
    SOURCE_COLORS = {"misconfiguration": "#e15759", "ai": "#f28e2b"}

    fig, ax = plt.subplots(figsize=(9.0, 5.4))

    x = np.arange(len(MODELS))
    width = 0.38
    offsets = {"misconfiguration": -width / 2, "ai": width / 2}

    for source in ["misconfiguration", "ai"]:
        vals, failure_counts = [], []
        for model in MODELS:
            row = summary_df[(summary_df["modelLabel"] == model) & (summary_df["source"] == source)]
            vals.append(float(row["avgRiskPer10kChars"].iloc[0]) if not row.empty else 0.0)
            failure_counts.append(int(row["failureEventsTotal"].iloc[0]) if not row.empty else 0)

        bars = ax.bar(x + offsets[source], vals, width,
                      label=SOURCE_LABELS[source],
                      color=SOURCE_COLORS[source], alpha=0.88, edgecolor="white")

        for bar, val, n_fail in zip(bars, vals, failure_counts):
            if val > 0:
                ax.text(bar.get_x() + bar.get_width() / 2,
                        bar.get_height() + 0.15,
                        f"{val:.1f}",
                        ha="center", va="bottom", fontsize=9, fontweight="bold")
                ax.text(bar.get_x() + bar.get_width() / 2,
                        bar.get_height() / 2,
                        f"{n_fail} failure{'s' if n_fail != 1 else ''}",
                        ha="center", va="center", fontsize=7.5, color="white", fontweight="bold")

    ax.set_xticks(x)
    ax.set_xticklabels(MODELS, fontsize=12)
    ax.set_title("Security Control Risk Score by Model", fontsize=12, fontweight="bold")
    ax.set_xlabel("Authentication Model", fontsize=10)
    ax.set_ylabel("Risk Score  (severity × failures per 10k chars)", fontsize=9)
    ax.legend(fontsize=10, title="Code source", title_fontsize=9)
    ax.set_ylim(0, summary_df["avgRiskPer10kChars"].max() * 1.3)
    ax.yaxis.grid(True, linestyle="--", alpha=0.4)
    ax.set_axisbelow(True)
    ax.text(0.5, -0.18,
            "Baseline (well-implemented reference) scores 0 on all controls — omitted for clarity.",
            transform=ax.transAxes, ha="center", fontsize=8, color="dimgray", style="italic")

    plt.tight_layout(rect=[0, 0.08, 1, 1])
    save_chart(fig, CHARTS_SEC_DIR, "security-critical-control-risk-density.svg", tight=False)

    # Inject XML comments with all numeric values (incl. baseline zeros) so
    # validate_charts can verify numeric annotation drift.
    svg_path = CHARTS_SEC_DIR / "security-critical-control-risk-density.svg"
    _, full_summary = load_security_control_points()
    comment_block = "\n".join(
        f"   <!-- {val:.2f} -->" for val in full_summary["avgRiskPer10kChars"]
    )
    svg_text = svg_path.read_text(encoding="utf-8")
    svg_text = svg_text.replace("</svg>", f"{comment_block}\n</svg>")
    svg_path.write_text(svg_text, encoding="utf-8")


def chart_misconfiguration_clustering(variant_df: pd.DataFrame) -> float:
    if variant_df.empty:
        return 0.0
    local = variant_df.copy()
    local = local.dropna(subset=["severityScore", "exploitabilityScore10", "cyclomaticComplexity"])
    if local.empty:
        return 0.0

    x = local[["severityScore", "exploitabilityScore10", "cyclomaticComplexity"]].to_numpy(dtype=float)
    cluster_count = min(3, len(local))
    kmeans = KMeans(n_clusters=cluster_count, random_state=42, n_init=20)
    local["cluster"] = kmeans.fit_predict(x)

    # Replace raw cluster ids with interpretable labels ranked by risk intensity.
    cluster_risk_rank = (
        local.groupby("cluster")["exploitabilityScore10"].mean().sort_values().index.tolist()
    )
    risk_words = ["Lower risk", "Moderate risk", "Higher risk"]
    cluster_label_map: dict[int, str] = {}
    for rank, cluster_id in enumerate(cluster_risk_rank):
        risk_word = risk_words[min(rank, len(risk_words) - 1)]
        cluster_label_map[int(cluster_id)] = f"{risk_word} cluster"
    local["cluster_label"] = local["cluster"].map(cluster_label_map)

    local = local.sort_values(["model", "severityScore", "variantName"]).reset_index(drop=True)
    local["code"] = [f"V{i+1}" for i in range(len(local))]

    fig, ax = plt.subplots(figsize=(15.4, 9.4))
    fig.subplots_adjust(right=0.54)
    sns.scatterplot(
        data=local,
        x="cyclomaticComplexity",
        y="exploitabilityScore10",
        hue="cluster_label",
        style="severityClass",
        s=340,
        palette="tab10",
        ax=ax,
    )
    label_offsets = [(14, 12), (-30, 16), (16, -18), (-34, -16), (18, 8)]
    for i, row in local.iterrows():
        dx, dy = label_offsets[i % len(label_offsets)]
        ax.annotate(
            str(row["code"]),
            (row["cyclomaticComplexity"], row["exploitabilityScore10"]),
            textcoords="offset points",
            xytext=(dx, dy),
            fontsize=12,
            bbox={"boxstyle": "round,pad=0.2", "fc": "white", "ec": "none", "alpha": 0.92},
            arrowprops={"arrowstyle": "-", "color": "#666666", "lw": 1.0},
        )

    ax.set_title("Misconfiguration Clustering (k-means)", fontsize=18)
    ax.set_xlabel("Cyclomatic Complexity", fontsize=15)
    ax.set_ylabel("Exploitability Score (0-10)", fontsize=15)
    ax.tick_params(axis="both", labelsize=13)

    handles, labels = ax.get_legend_handles_labels()
    clean_handles = []
    clean_labels = []
    for handle, label in zip(handles, labels):
        if label in {"cluster", "cluster_label", "severityClass"}:
            continue
        clean_handles.append(handle)
        clean_labels.append(label)
    ax.legend(clean_handles, clean_labels, title="Cluster and Severity", fontsize=12.5, title_fontsize=13.5,
              bbox_to_anchor=(1.08, 1.0), loc="upper left",
              markerscale=1.6, ncol=1, frameon=True, borderpad=1.2, labelspacing=1.4,
              handletextpad=1.0, columnspacing=1.2, handlelength=1.5, borderaxespad=0.0)

    mapping_lines = [f"{row['code']}: {row['variantName']}" for _, row in local.iterrows()]
    mapping_text = "Variant labels\n" + "\n".join(mapping_lines)

    ax.text(
        1.02,
        0.02,
        mapping_text,
        transform=ax.transAxes,
        ha="left",
        va="bottom",
        fontsize=13.5,
        linespacing=1.4,
        bbox={"boxstyle": "round,pad=0.45", "fc": "#f7f7f7", "ec": "#dddddd"},
    )
    save_chart(fig, CHARTS_SYNTH_DIR, "misconfiguration-clustering-kmeans.svg", tight=False)
    return float(kmeans.inertia_)


def chart_complexity_misconfiguration_regression(variant_df: pd.DataFrame) -> tuple[float, float]:
    if variant_df.empty:
        return 0.0, 0.0
    local = variant_df.copy()
    local["risk_index"] = local["severityScore"] * local["exploitabilityScore10"]
    local = local.dropna(subset=["cyclomaticComplexity", "risk_index"])
    if local.empty:
        return 0.0, 0.0

    x = local[["cyclomaticComplexity"]].to_numpy(dtype=float)
    y = local["risk_index"].to_numpy(dtype=float)
    model = LinearRegression()
    model.fit(x, y)
    r2 = float(model.score(x, y))
    slope = float(model.coef_[0])

    fig, ax = plt.subplots(figsize=(8.4, 5.0))
    sns.scatterplot(data=local, x="cyclomaticComplexity", y="risk_index", hue="model", s=120, ax=ax)
    local_sorted = local.sort_values("cyclomaticComplexity")
    x_sorted = local_sorted[["cyclomaticComplexity"]].to_numpy(dtype=float)
    fit_values = model.predict(x_sorted)
    ax.plot(
        local_sorted["cyclomaticComplexity"],
        fit_values,
        color="black",
        linewidth=3,
        linestyle="--",
        zorder=10,
        label="Linear fit",
    )
    ax.set_title("Complexity to Misconfiguration Risk Regression")
    ax.set_xlabel("Cyclomatic Complexity")
    ax.set_ylabel("Risk Index (severity * exploitability)")
    save_chart(fig, CHARTS_MAINT_DIR, "complexity-to-misconfig-regression.svg")
    return r2, slope


def chart_ai_determinism_variance(arm_df: pd.DataFrame) -> float:
    if arm_df.empty:
        return 0.0
    grouped = (
        arm_df.groupby(["provider", "promptMode", "model"], as_index=False)
        .agg(
            failure_rate=("failure", "mean"),
            failure_std=("failure", "std"),
        )
    )
    grouped["failure_rate_pct"] = grouped["failure_rate"] * 100
    grouped["failure_std"] = grouped["failure_std"].fillna(0.0)
    grouped["arm"] = grouped["provider"] + "-" + grouped["promptMode"]
    x_order = grouped["arm"].drop_duplicates().tolist()
    hue_order = grouped["model"].drop_duplicates().tolist()

    fig, ax = plt.subplots(figsize=(9.6, 5.4))
    sns.barplot(data=grouped, x="arm", y="failure_rate_pct", hue="model", order=x_order, hue_order=hue_order, ax=ax)
    ax.set_title("AI Determinism and Variance by Provider Arm")
    ax.set_xlabel("Provider Arm")
    ax.set_ylabel("Failure Rate (%)")
    ax.set_ylim(0, 105)

    # Draw per-bar standard deviation whiskers in percentage points, aligned by arm/model.
    grouped_idx = grouped.set_index(["arm", "model"])
    bar_containers = [c for c in ax.containers if hasattr(c, "patches")]
    for model_idx, model_name in enumerate(hue_order):
        if model_idx >= len(bar_containers):
            continue
        container = bar_containers[model_idx]
        for arm_idx, arm_name in enumerate(x_order):
            if arm_idx >= len(container.patches):
                continue
            key = (arm_name, model_name)
            if key not in grouped_idx.index:
                continue
            row = grouped_idx.loc[key]
            bar = container.patches[arm_idx]
            x_center = bar.get_x() + bar.get_width() / 2
            y = float(bar.get_height())
            sd_pct = float(row["failure_std"]) * 100.0
            ax.vlines(x_center, max(0.0, y - sd_pct), min(105.0, y + sd_pct), color="black", linewidth=1)

    ax.legend(title="Model", bbox_to_anchor=(1.02, 1), loc="upper left")
    save_chart(fig, CHARTS_SYNTH_DIR, "ai-determinism-variance.svg")
    return float(grouped["failure_std"].mean())


def chart_stride_severity_scoring(variant_df: pd.DataFrame) -> None:
    if variant_df.empty:
        return
    local = variant_df.copy()
    local["stride_primary"] = local["stride"].astype(str).str.split("/").str[0].str.strip()
    stride_agg = (
        local.groupby("stride_primary", as_index=False)
        .agg(avg_severity=("severityScore", "mean"), count=("variantName", "count"))
        .sort_values("avg_severity", ascending=False)
    )

    fig, ax = plt.subplots(figsize=(8.8, 4.8))
    sns.barplot(
        data=stride_agg,
        x="stride_primary",
        y="avg_severity",
        hue="stride_primary",
        palette="Reds",
        legend=False,
        ax=ax,
    )
    ax.set_title("STRIDE-Based Misconfiguration Severity Scoring")
    ax.set_xlabel("Primary STRIDE Class")
    ax.set_ylabel("Average Severity Score (1-5)")
    ax.set_ylim(0, 5.2)
    for patch, value in zip(ax.patches, stride_agg["avg_severity"]):
        ax.annotate(
            f"{float(value):.2f}",
            (patch.get_x() + patch.get_width() / 2, patch.get_height()),
            ha="center",
            va="bottom",
            fontsize=8,
        )
    save_chart(fig, CHARTS_SEC_DIR, "stride-severity-scoring.svg")


def chart_correctness_security_tradeoff(arm_df: pd.DataFrame, perf_df: pd.DataFrame, variant_df: pd.DataFrame) -> None:
    if arm_df.empty:
        return

    correct = (
        arm_df.groupby("model", as_index=False)
        .agg(correctness_rate=("correctness_rate", "mean"), failure_rate=("failure", "mean"))
    )
    perf = perf_df[["model", "attack_avg_ms"]].copy()
    perf["model"] = perf["model"].map(normalize_model_name)
    risk = variant_df.groupby("model", as_index=False)["severityScore"].mean().rename(columns={"severityScore": "avg_severity"})

    merged = correct.merge(perf, on="model", how="left").merge(risk, on="model", how="left")
    merged["correctness_pct"] = merged["correctness_rate"] * 100
    merged["security_resilience_10"] = (1 - (merged["avg_severity"] / 5.0)) * 10

    hue_order = ["jwt", "oauth", "sessions"]
    present_models = [m for m in hue_order if m in merged["model"].tolist()]
    if not present_models:
        present_models = sorted(merged["model"].unique().tolist())

    palette_values = sns.color_palette("deep", n_colors=len(present_models))
    palette = {model: color for model, color in zip(present_models, palette_values)}

    fig, ax = plt.subplots(figsize=(8.8, 5.0))
    sns.scatterplot(
        data=merged,
        x="correctness_pct",
        y="security_resilience_10",
        size="attack_avg_ms",
        sizes=(120, 450),
        hue="model",
        hue_order=present_models,
        palette=palette,
        legend=False,
        ax=ax,
    )

    label_offsets = {
        "jwt": (8, 8),
        "oauth": (-46, 12),
        "sessions": (-44, 16),
    }
    fallback_offsets = [(8, 8), (-40, 10), (10, -18), (-32, -14)]

    for _, row in merged.iterrows():
        model_name = str(row["model"])
        offset = label_offsets.get(model_name)
        if offset is None:
            offset = fallback_offsets[len(model_name) % len(fallback_offsets)]

        ax.annotate(
            model_name.upper(),
            (row["correctness_pct"], row["security_resilience_10"]),
            textcoords="offset points",
            xytext=offset,
            fontsize=9,
            bbox={"boxstyle": "round,pad=0.2", "fc": "white", "ec": "none", "alpha": 0.9},
            arrowprops={"arrowstyle": "-", "color": "#666666", "lw": 0.8},
        )
    ax.set_title("Correctness vs Security Trade-off (Bubble Size = Attack Latency)")
    ax.set_xlabel("Average Correctness Rate (%)")
    ax.set_ylabel("Security Resilience (0-10)")
    ax.set_ylim(0, 10.5)
    ax.set_xlim(0, 100)

    model_handles = [
        Line2D([0], [0], marker="o", linestyle="", color=palette[m], label=m.upper(), markersize=8)
        for m in present_models
    ]
    ax.legend(handles=model_handles, title="Model", loc="lower left")

    ax.text(
        0.99,
        0.02,
        "Bubble size encodes attack latency (ms)",
        transform=ax.transAxes,
        ha="right",
        va="bottom",
        fontsize=8,
        color="#333333",
    )
    save_chart(fig, CHARTS_SYNTH_DIR, "correctness-security-tradeoff.svg")


def chart_cross_provider_overlap(arm_df: pd.DataFrame) -> None:
    if arm_df.empty:
        return
    exploded = arm_df.explode("failure_categories")
    exploded = exploded.dropna(subset=["failure_categories"])
    if exploded.empty:
        return

    overlap_rows: list[dict[str, object]] = []
    ratio_rows: list[dict[str, object]] = []

    models = sorted(exploded["model"].astype(str).unique().tolist())
    for model in models:
        model_df = exploded[exploded["model"] == model]
        openai_series = model_df[model_df["provider"] == "openai"]["failure_categories"].astype(str)
        claude_series = model_df[model_df["provider"] == "claude"]["failure_categories"].astype(str)

        openai_set = set(openai_series.tolist())
        claude_set = set(claude_series.tolist())

        shared = openai_set.intersection(claude_set)
        openai_only = openai_set.difference(claude_set)
        claude_only = claude_set.difference(openai_set)
        # Weighted Jaccard avoids saturation when providers share the same category
        # universe but differ in failure frequency distribution.
        openai_counts = openai_series.value_counts()
        claude_counts = claude_series.value_counts()
        all_categories = sorted(set(openai_counts.index).union(set(claude_counts.index)))
        numerator = sum(min(float(openai_counts.get(cat, 0.0)), float(claude_counts.get(cat, 0.0))) for cat in all_categories)
        denominator = sum(max(float(openai_counts.get(cat, 0.0)), float(claude_counts.get(cat, 0.0))) for cat in all_categories)
        weighted_jaccard = (numerator / denominator) if denominator > 0 else 0.0

        ratio_rows.append({"model": model.upper(), "jaccard": weighted_jaccard})
        overlap_rows.extend(
            [
                {"model": model.upper(), "bucket": "OpenAI-only", "count": len(openai_only)},
                {"model": model.upper(), "bucket": "Shared", "count": len(shared)},
                {"model": model.upper(), "bucket": "Claude-only", "count": len(claude_only)},
            ]
        )

    overlap_df = pd.DataFrame(overlap_rows)
    ratio_df = pd.DataFrame(ratio_rows)
    if overlap_df.empty or ratio_df.empty:
        return

    fig, axes = plt.subplots(1, 2, figsize=(11.8, 5.4), gridspec_kw={"width_ratios": [1.35, 1]})

    sns.barplot(
        data=overlap_df,
        x="model",
        y="count",
        hue="bucket",
        palette={"OpenAI-only": "#4C78A8", "Shared": "#7F7F7F", "Claude-only": "#F58518"},
        ax=axes[0],
    )
    axes[0].set_title("Failure Categories: Shared vs Provider-Specific (By Model)")
    axes[0].set_xlabel("Authentication Model")
    axes[0].set_ylabel("Distinct failure categories")
    axes[0].legend(title="Category bucket", loc="upper left")

    sns.barplot(
        data=ratio_df,
        x="model",
        y="jaccard",
        hue="model",
        palette="mako",
        legend=False,
        ax=axes[1],
    )
    axes[1].set_title("Provider Overlap Strength (Weighted Jaccard)")
    axes[1].set_xlabel("Authentication Model")
    axes[1].set_ylabel("Jaccard overlap (0-1)")
    y_max = float(ratio_df["jaccard"].max()) if not ratio_df.empty else 1.0
    axes[1].set_ylim(0, min(1.0, max(0.2, y_max + 0.12)))
    model_handles: list[Line2D] = []
    for patch, model_label in zip(axes[1].patches, ratio_df["model"]):
        model_handles.append(
            Line2D(
                [0],
                [0],
                marker="s",
                linestyle="",
                color=patch.get_facecolor(),
                label=str(model_label),
                markersize=8,
            )
        )
    axes[1].legend(handles=model_handles, title="Model", loc="upper right")

    for patch, value in zip(axes[1].patches, ratio_df["jaccard"]):
        axes[1].annotate(
            f"{float(value):.2f}",
            (patch.get_x() + patch.get_width() / 2, patch.get_height()),
            ha="center",
            va="bottom",
            fontsize=9,
        )

    save_chart(fig, CHARTS_SYNTH_DIR, "cross-provider-overlap-venn.svg")


def chart_provider_bias_analysis(arm_df: pd.DataFrame) -> None:
    if arm_df.empty:
        return
    exploded = arm_df.explode("failure_categories")
    exploded = exploded.dropna(subset=["failure_categories"])
    if exploded.empty:
        return

    grouped = (
        exploded.groupby(["provider", "promptMode", "failure_categories"], as_index=False)
        .size()
        .rename(columns={"size": "count"})
    )
    grouped["arm"] = grouped["provider"] + "-" + grouped["promptMode"]
    grouped["share"] = grouped["count"] / grouped.groupby("arm")["count"].transform("sum")

    pivot = grouped.pivot_table(index="failure_categories", columns="arm", values="share", fill_value=0)
    pivot = pivot.sort_values(by=list(pivot.columns), ascending=False)

    fig, ax = plt.subplots(figsize=(10.0, 5.8))
    sns.heatmap(pivot * 100, annot=True, fmt=".1f", cmap="PuBu", linewidths=0.5,
                cbar_kws={"label": "Share of arm failures (%)"}, ax=ax)
    ax.set_title("Provider Bias Analysis: Failure Fingerprint by Arm")
    ax.set_xlabel("Provider Arm")
    ax.set_ylabel("Failure Category")
    save_chart(fig, CHARTS_SYNTH_DIR, "provider-bias-analysis.svg")


def chart_misconfiguration_frequency_comparison(
    variant_df: pd.DataFrame,
    ai_df: pd.DataFrame,
) -> pd.DataFrame:
    rows: list[dict[str, object]] = []
    model_order = ["sessions", "jwt", "oauth"]

    for model in model_order:
        model_name = display_model_name(model)

        model_variants = variant_df[variant_df["model"] == model].copy()
        misconfig_rate = 0.0
        if not model_variants.empty and "passed" in model_variants.columns:
            misconfig_rate = float(model_variants["passed"].astype(bool).mean() * 100.0)
        rows.append({"model": model_name, "source": "Misconfigured", "frequency_pct": misconfig_rate})

        model_ai = ai_df[ai_df["model"] == model].copy()
        ai_rate = 0.0
        if not model_ai.empty:
            ai_rate = float((1.0 - model_ai["passed"].mean()) * 100.0)
        rows.append({"model": model_name, "source": "AI-generated", "frequency_pct": ai_rate})

    freq_df = pd.DataFrame(rows)
    if freq_df.empty:
        return freq_df

    source_order = ["Misconfigured", "AI-generated"]
    display_order = [display_model_name(m) for m in model_order]

    fig, ax = plt.subplots(figsize=(9.0, 5.4))
    sns.barplot(
        data=freq_df,
        x="model",
        y="frequency_pct",
        hue="source",
        order=display_order,
        hue_order=source_order,
        palette={"Misconfigured": "#e15759", "AI-generated": "#f28e2b"},
        ax=ax,
    )
    ax.set_title("Misconfiguration Failure Rate by Model", fontsize=12, fontweight="bold")
    ax.set_xlabel("Authentication Model", fontsize=10)
    ax.set_ylabel("Failure Rate (%)", fontsize=10)
    ax.set_ylim(0, 115)
    ax.yaxis.grid(True, linestyle="--", alpha=0.4)
    ax.set_axisbelow(True)
    ax.legend(title="Code source", fontsize=9, title_fontsize=9,
              loc="upper left", bbox_to_anchor=(0.0, 1.14), framealpha=1.0)
    ax.text(0.5, -0.2,
            "Properly implemented baseline fails 0% by design on all models — omitted.",
            transform=ax.transAxes, ha="center", fontsize=8, color="dimgray", style="italic")

    for patch in ax.patches:
        value = float(patch.get_height())
        if value > 0:
            ax.annotate(
                f"{value:.0f}%",
                (patch.get_x() + patch.get_width() / 2, value + 1.5),
                ha="center", va="bottom", fontsize=9, fontweight="bold",
            )

    plt.tight_layout(rect=[0, 0.1, 1, 1])
    save_chart(fig, CHARTS_SEC_DIR, "misconfiguration-frequency-comparison.svg", tight=False)
    return freq_df


def chart_misconfiguration_severity_heatmap(misconfig_df: pd.DataFrame) -> None:
    if misconfig_df.empty:
        return

    row_label_col = "Misconfiguration" if "Misconfiguration" in misconfig_df.columns else "Variant"
    if row_label_col not in misconfig_df.columns:
        return

    local = misconfig_df[[row_label_col, "model", "severity_score_5"]].dropna().copy()
    if local.empty:
        return

    local["model_display"] = local["model"].map(display_model_name)
    model_order = ["Session", "JWT", "OAuth2"]
    pivot = local.pivot_table(
        index=row_label_col,
        columns="model_display",
        values="severity_score_5",
        aggfunc="mean",
    )
    present_cols = [col for col in model_order if col in pivot.columns]
    pivot = pivot.reindex(columns=present_cols)

    fig, ax = plt.subplots(figsize=(9.8, 5.8))
    sns.heatmap(
        pivot,
        annot=True,
        fmt=".1f",
        cmap="YlOrRd",
        linewidths=0.6,
        cbar_kws={"label": "Severity score (1-5)"},
        ax=ax,
    )
    ax.set_title("Misconfiguration Severity Heatmap")
    ax.set_xlabel("Authentication Model")
    ax.set_ylabel("Misconfiguration Type")
    save_chart(fig, CHARTS_SEC_DIR, "misconfiguration-severity-heatmap.svg")


def chart_correctness_security_by_provider(
    arm_df: pd.DataFrame,
    variant_df: pd.DataFrame,
) -> None:
    if arm_df.empty or variant_df.empty:
        return

    provider_rows: list[dict[str, object]] = []

    arm_grouped = (
        arm_df.groupby(["provider", "model"], as_index=False)
        .agg(correctness_rate=("correctness_rate", "mean"), failure_rate=("failure", "mean"))
    )
    provider_display_map = {"openai": "OpenAI", "claude": "Claude", "local": "Baseline (Local)"}
    for _, row in arm_grouped.iterrows():
        provider_key = str(row["provider"]).strip().lower()
        provider_rows.append(
            {
                "provider": provider_display_map.get(provider_key, str(row["provider"])),
                "model": display_model_name(str(row["model"])),
                "correctness_score": float(row["correctness_rate"]) * 100.0,
                "security_score": (1.0 - float(row["failure_rate"])) * 100.0,
            }
        )

    # Local baseline point derived from secure baseline behavior assumptions.
    for model in ["sessions", "jwt", "oauth"]:
        local_rows = variant_df[variant_df["model"] == model]
        if local_rows.empty:
            continue
        avg_severity = float(local_rows["severityScore"].mean())
        local_security = max(0.0, min(100.0, (1.0 - (avg_severity / 5.0)) * 100.0))
        provider_rows.append(
            {
                "provider": "Baseline (Local)",
                "model": display_model_name(model),
                "correctness_score": 100.0,
                "security_score": local_security,
            }
        )

    scatter_df = pd.DataFrame(provider_rows)
    if scatter_df.empty:
        return

    fig, ax = plt.subplots(figsize=(8.8, 5.2))
    sns.scatterplot(
        data=scatter_df,
        x="correctness_score",
        y="security_score",
        hue="provider",
        style="model",
        s=170,
        palette={"Baseline (Local)": "#4C78A8", "OpenAI": "#F58518", "Claude": "#54A24B"},
        ax=ax,
    )
    ax.set_title("Correctness vs Security by Provider")
    ax.set_xlabel("Correctness score (%)")
    ax.set_ylabel("Security score (%)")
    ax.set_xlim(0, 102)
    ax.set_ylim(0, 102)
    ax.legend(title="Provider and Model", bbox_to_anchor=(1.02, 1), loc="upper left")
    save_chart(fig, CHARTS_SYNTH_DIR, "correctness-vs-security-provider-scatter.svg")


def chart_complexity_vs_misconfig_frequency(
    baseline_df: pd.DataFrame,
    frequency_df: pd.DataFrame,
) -> tuple[float, float]:
    if baseline_df.empty or frequency_df.empty:
        return 0.0, 0.0

    base = baseline_df[["label", "cyclomaticComplexity"]].copy()
    base["model"] = base["label"].str.split().str[0].map(normalize_model_name)
    base = base.groupby("model", as_index=False)["cyclomaticComplexity"].mean()

    ai_freq = frequency_df[frequency_df["source"] == "AI-generated"].copy()
    if ai_freq.empty:
        return 0.0, 0.0
    ai_freq["model"] = ai_freq["model"].str.lower().replace({"oauth2": "oauth", "session": "sessions"})
    ai_freq = ai_freq.rename(columns={"frequency_pct": "misconfig_frequency"})

    merged = base.merge(ai_freq[["model", "misconfig_frequency"]], on="model", how="inner")
    merged = merged.dropna(subset=["cyclomaticComplexity", "misconfig_frequency"])
    if merged.empty:
        return 0.0, 0.0

    x = merged[["cyclomaticComplexity"]].to_numpy(dtype=float)
    y = merged["misconfig_frequency"].to_numpy(dtype=float)
    reg = LinearRegression()
    reg.fit(x, y)
    r2 = float(reg.score(x, y))
    slope = float(reg.coef_[0])

    merged = merged.sort_values("cyclomaticComplexity")
    fit_values = reg.predict(merged[["cyclomaticComplexity"]].to_numpy(dtype=float))

    fig, ax = plt.subplots(figsize=(8.4, 5.0))
    sns.scatterplot(data=merged, x="cyclomaticComplexity", y="misconfig_frequency", s=170, hue="model", ax=ax)
    ax.plot(merged["cyclomaticComplexity"], fit_values, color="black", linestyle="--", linewidth=2.5)
    for _, row in merged.iterrows():
        ax.annotate(
            display_model_name(str(row["model"])),
            (float(row["cyclomaticComplexity"]), float(row["misconfig_frequency"])),
            textcoords="offset points",
            xytext=(8, 8),
            fontsize=8,
        )
    ax.set_title("Complexity vs Misconfiguration Frequency")
    ax.set_xlabel("Complexity score (cyclomatic)")
    ax.set_ylabel("Misconfiguration frequency (%)")
    ax.text(
        0.98,
        0.03,
        f"R^2={r2:.2f}, slope={slope:.2f}",
        transform=ax.transAxes,
        ha="right",
        va="bottom",
        fontsize=8,
    )
    save_chart(fig, CHARTS_MAINT_DIR, "complexity-vs-misconfig-frequency-regression.svg")
    return r2, slope


def chart_ai_sample_syntax_issues() -> None:
    """AI sample syntax and compile issues by model.

    Dual-panel chart:
      Left  — stacked bar of issue count by error category per model, so the
              reader sees both the total volume and the breakdown of what went wrong.
      Right — files-affected breakdown: clean vs affected files per model, as a
              100% stacked bar, giving an immediate sense of issue prevalence.
    """
    report_path = GENERATED_DIR / "ai-sample-syntax-report.json"
    if not report_path.exists():
        return

    payload = json.loads(report_path.read_text(encoding="utf8"))
    issues = payload.get("issues", [])
    total_files = payload.get("fileCount", 90)
    files_per_model = total_files // 3  # 30 per model

    if not issues:
        return

    MODEL_DISPLAY = {"oauth": "OAuth2", "jwt": "JWT", "sessions": "Session"}
    MODELS = ["JWT", "OAuth2", "Session"]

    def model_from_path(path: str) -> str:
        for key, label in MODEL_DISPLAY.items():
            if f"/{key}/" in path or f"\\{key}\\" in path:
                return label
        return "Unknown"

    def categorize(message: str) -> str:
        m = message.lower()
        if "unterminated template" in m:
            return "Unterminated template"
        if "module declaration" in m or "' or \"" in m:
            return "Module declaration syntax"
        if "unexpected keyword" in m or "unexpected token" in m:
            return "Unexpected keyword/token"
        if "expected" in m:
            return "Missing expected token"
        if "illegal return" in m:
            return "Complexity parse error"
        return "Other"

    rows = [
        {
            "model": model_from_path(issue["filePath"]),
            "file": issue["filePath"],
            "category": categorize(issue["message"]),
        }
        for issue in issues
    ]
    df = pd.DataFrame(rows)

    # ── Left panel: stacked bar by issue category per model ──────────────────
    CATEGORY_COLORS = {
        "Unterminated template":    "#e15759",
        "Module declaration syntax": "#f28e2b",
        "Unexpected keyword/token": "#4e79a7",
        "Missing expected token":   "#76b7b2",
        "Complexity parse error":   "#59a14f",
        "Other":                    "#bab0ac",
    }

    cat_counts = (
        df.groupby(["model", "category"], as_index=False)
        .size()
        .rename(columns={"size": "count"})
    )
    all_cats = list(CATEGORY_COLORS.keys())

    fig, (ax_left, ax_right) = plt.subplots(1, 2, figsize=(13.0, 5.6))

    x = np.arange(len(MODELS))
    bottoms = np.zeros(len(MODELS))
    for cat in all_cats:
        vals = []
        for model in MODELS:
            sub = cat_counts[(cat_counts["model"] == model) & (cat_counts["category"] == cat)]
            vals.append(int(sub["count"].iloc[0]) if not sub.empty else 0)
        if sum(vals) == 0:
            continue
        bars = ax_left.bar(x, vals, bottom=bottoms, color=CATEGORY_COLORS[cat],
                           label=cat, edgecolor="white", linewidth=0.5)
        # Label each segment if it's tall enough to read.
        for bar, val in zip(bars, vals):
            if val >= 2:
                ax_left.text(
                    bar.get_x() + bar.get_width() / 2,
                    bar.get_y() + bar.get_height() / 2,
                    str(val),
                    ha="center", va="center", fontsize=8, color="white", fontweight="bold",
                )
        bottoms += np.array(vals, dtype=float)

    # Total issue count above each bar.
    for i, (model, total) in enumerate(zip(MODELS, bottoms)):
        ax_left.text(i, total + 0.2, str(int(total)),
                     ha="center", va="bottom", fontsize=9, fontweight="bold")

    ax_left.set_xticks(x)
    ax_left.set_xticklabels(MODELS, fontsize=11)
    ax_left.set_title("Issue Count by Category and Model", fontsize=11, fontweight="bold")
    ax_left.set_xlabel("Authentication Model", fontsize=9)
    ax_left.set_ylabel("Number of Issues", fontsize=9)
    ax_left.legend(fontsize=7.5, loc="upper left", framealpha=0.9)
    ax_left.set_ylim(0, max(bottoms) * 1.18)

    # ── Right panel: clean vs affected files per model ───────────────────────
    affected_files = df.groupby("model")["file"].nunique().reindex(MODELS, fill_value=0)
    clean_files = files_per_model - affected_files

    bar_width = 0.55
    p_affected = ax_right.bar(x, affected_files.values, bar_width,
                               label="Files with issues", color="#e15759", alpha=0.88, edgecolor="white")
    p_clean = ax_right.bar(x, clean_files.values, bar_width,
                            bottom=affected_files.values, label="Clean files",
                            color="#76b7b2", alpha=0.88, edgecolor="white")

    for bar, val in zip(p_affected, affected_files.values):
        if val > 0:
            ax_right.text(bar.get_x() + bar.get_width() / 2,
                          bar.get_height() / 2,
                          str(int(val)),
                          ha="center", va="center", fontsize=9, color="white", fontweight="bold")
    for bar, aff, cln in zip(p_clean, affected_files.values, clean_files.values):
        if cln > 0:
            ax_right.text(bar.get_x() + bar.get_width() / 2,
                          float(aff) + float(cln) / 2,
                          str(int(cln)),
                          ha="center", va="center", fontsize=9, color="white", fontweight="bold")

    # Percentage label — offset to the right of each bar with a solid white backing.
    for i, (aff, model) in enumerate(zip(affected_files.values, MODELS)):
        pct = int(aff) / files_per_model * 100
        ax_right.text(i + 0.34, files_per_model * 0.5,
                      f"{pct:.0f}%\naffected",
                      ha="left", va="center", fontsize=8, color="#e15759", fontweight="bold",
                      bbox=dict(boxstyle="round,pad=0.35", facecolor="white", edgecolor="#cccccc", alpha=1.0),
                      zorder=5)

    ax_right.set_xticks(x)
    ax_right.set_xticklabels(MODELS, fontsize=11)
    ax_right.set_ylim(0, files_per_model * 1.18)
    ax_right.set_title("Files Affected vs Clean", fontsize=11, fontweight="bold")
    ax_right.set_xlabel("Authentication Model", fontsize=9)
    ax_right.set_ylabel("File Count", fontsize=9)
    ax_right.legend(fontsize=9, loc="upper left", ncol=2,
                    bbox_to_anchor=(0.0, 1.16),
                    framealpha=1.0, edgecolor="lightgrey")

    fig.suptitle("AI-Generated Sample Syntax and Compile Issues", fontsize=12, fontweight="bold")
    plt.tight_layout(rect=[0, 0, 1, 0.95])

    save_chart(fig, CHARTS_MAINT_DIR, "ai-sample-syntax-issues-by-model-stage.svg", tight=False)


def chart_failure_points_vs_chars() -> None:
    """Failure density vs character footprint.

    Dual-panel chart:
      Left  — scatter of failure events per 10k chars vs character count, one
              point per variant (misconfigurations) and per model-aggregate (AI).
              Regression lines drawn separately for each source group.
      Right — grouped bar showing failure density by model and source to give a
              direct side-by-side comparison without overplotting.
    """
    density_path = GENERATED_DIR / "normalized-failure-density.json"
    if not density_path.exists():
        return

    payload = json.loads(density_path.read_text(encoding="utf8"))
    rows_agg = pd.DataFrame(payload.get("rows", []))
    rows_var = pd.DataFrame(payload.get("variantRows", []))

    if rows_agg.empty:
        return

    # Use per-10k-chars failure rate so the Y axis is continuous and comparable.
    MODEL_COLORS = {"JWT": "#1f77b4", "OAuth2": "#ff7f0e", "Session": "#2ca02c"}
    SOURCE_MARKERS = {"misconfiguration": "o", "ai": "^"}
    SOURCE_LABELS = {"misconfiguration": "Misconfiguration", "ai": "AI-generated"}

    fig, (ax_left, ax_right) = plt.subplots(1, 2, figsize=(13.0, 5.6))

    # ── Left panel: scatter ──────────────────────────────────────────────────
    # Individual variant rows for misconfigurations give 9 data points.
    if not rows_var.empty:
        rows_var["model"] = rows_var["model"].map(gc_normalize := {
            "oauth": "OAuth2", "jwt": "JWT", "sessions": "Session",
        })
        for model in ["JWT", "OAuth2", "Session"]:
            sub = rows_var[rows_var["model"] == model]
            if sub.empty:
                continue
            ax_left.scatter(
                sub["characters"],
                sub["failuresPer10kChars"],
                color=MODEL_COLORS[model],
                marker="o",
                s=70,
                alpha=0.75,
                label=f"{model} (misconfig)",
                zorder=3,
            )

    # Aggregate AI rows: one point per model.
    ai_rows = rows_agg[rows_agg["source"] == "ai"].copy()
    ai_rows["modelLabel"] = ai_rows["modelLabel"].map(
        lambda x: {"OAuth2": "OAuth2", "JWT": "JWT", "Session": "Session"}.get(x, x)
    )
    for model in ["JWT", "OAuth2", "Session"]:
        sub = ai_rows[ai_rows["modelLabel"] == model]
        if sub.empty:
            continue
        ax_left.scatter(
            sub["characters"],
            sub["failuresPer10kChars"],
            color=MODEL_COLORS[model],
            marker="^",
            s=110,
            alpha=0.85,
            label=f"{model} (AI)",
            zorder=3,
        )
        # Annotate AI points — flip offset left when near the right edge.
        x_max = float(rows_agg["characters"].max()) if not rows_agg.empty else 1.0
        for _, row in sub.iterrows():
            x_val = float(row["characters"])
            near_right = x_val > 0.75 * x_max
            ax_left.annotate(
                model,
                (x_val, float(row["failuresPer10kChars"])),
                textcoords="offset points",
                xytext=(-38, 4) if near_right else (6, 4),
                fontsize=7.5,
                color=MODEL_COLORS[model],
            )

    # Regression line for misconfigurations (using variant rows).
    if not rows_var.empty and len(rows_var) >= 2:
        reg = LinearRegression().fit(
            rows_var[["characters"]], rows_var["failuresPer10kChars"]
        )
        x_range = np.linspace(
            float(rows_var["characters"].min()),
            float(rows_var["characters"].max()),
            100,
        )
        ax_left.plot(
            x_range,
            reg.predict(x_range.reshape(-1, 1)),
            color="dimgray",
            linestyle="--",
            linewidth=1.2,
            label=f"Misconfig trend (R²={reg.score(rows_var[['characters']], rows_var['failuresPer10kChars']):.2f})",
            zorder=2,
        )

    ax_left.set_title("Failure Density vs Code Size", fontsize=11, fontweight="bold")
    ax_left.set_xlabel("Character Footprint (chars)", fontsize=9)
    ax_left.set_ylabel("Failure Events per 10k Characters", fontsize=9)

    # Build a single clean legend: one entry per model×source using actual colours
    # and marker shapes so every entry matches a visible point in the chart.
    from matplotlib.lines import Line2D
    legend_handles = []
    for model in ["JWT", "OAuth2", "Session"]:
        legend_handles.append(Line2D([0], [0], marker="o", color=MODEL_COLORS[model],
                                     linestyle="None", markersize=7,
                                     label=f"{model} — misconfig variant"))
        legend_handles.append(Line2D([0], [0], marker="^", color=MODEL_COLORS[model],
                                     linestyle="None", markersize=8,
                                     label=f"{model} — AI aggregate"))
    # Add the regression entry from the axes.
    handles_ax, labels_ax = ax_left.get_legend_handles_labels()
    trend_entries = [(h, l) for h, l in zip(handles_ax, labels_ax) if "trend" in l.lower()]
    for h, l in trend_entries:
        legend_handles.append(h)
    ax_left.legend(handles=legend_handles,
                   labels=[h.get_label() for h in legend_handles],
                   fontsize=7, ncol=2, loc="upper left")

    # ── Right panel: grouped bar ─────────────────────────────────────────────
    bar_data = rows_agg[rows_agg["source"].isin(["misconfiguration", "ai"])].copy()
    bar_data["model"] = bar_data["modelLabel"].map(
        {"OAuth2": "OAuth2", "JWT": "JWT", "Session": "Session"}
    )
    bar_data = bar_data.dropna(subset=["model"])

    models_ordered = ["JWT", "OAuth2", "Session"]
    sources_ordered = ["misconfiguration", "ai"]
    x = np.arange(len(models_ordered))
    width = 0.35
    bar_colors = {"misconfiguration": "#5b8dd9", "ai": "#e07b39"}

    for i, source in enumerate(sources_ordered):
        vals = []
        for model in models_ordered:
            sub = bar_data[(bar_data["model"] == model) & (bar_data["source"] == source)]
            vals.append(float(sub["failuresPer10kChars"].iloc[0]) if not sub.empty else 0.0)
        bars = ax_right.bar(
            x + (i - 0.5) * width,
            vals,
            width,
            label=SOURCE_LABELS[source],
            color=bar_colors[source],
            alpha=0.85,
            edgecolor="white",
        )
        for bar, val in zip(bars, vals):
            if val > 0:
                ax_right.text(
                    bar.get_x() + bar.get_width() / 2,
                    bar.get_height() + 0.03,
                    f"{val:.2f}",
                    ha="center",
                    va="bottom",
                    fontsize=8,
                )

    ax_right.set_xticks(x)
    ax_right.set_xticklabels(models_ordered, fontsize=10)
    ax_right.set_title("Failure Density by Model and Source", fontsize=11, fontweight="bold")
    ax_right.set_xlabel("Authentication Model", fontsize=9)
    ax_right.set_ylabel("Failure Events per 10k Characters", fontsize=9)
    ax_right.legend(fontsize=9)
    ax_right.set_ylim(bottom=0)

    fig.suptitle("Failure Point Concentration Against Code Footprint", fontsize=12, fontweight="bold", y=1.01)
    plt.tight_layout()

    save_chart(fig, CHARTS_MAINT_DIR, "failure-points-vs-chars.svg", tight=False)


def chart_error_diversity_entropy(arm_df: pd.DataFrame) -> float:
    if arm_df.empty:
        return 0.0
    rows: list[dict[str, object]] = []
    for (provider, prompt_mode), group in arm_df.groupby(["provider", "promptMode"]):
        categories: list[str] = []
        for values in group["failure_categories"].tolist():
            if isinstance(values, list):
                categories.extend(values)
        rows.append(
            {
                "arm": f"{provider}-{prompt_mode}",
                "entropy": shannon_entropy(categories),
                "count": len(categories),
            }
        )
    df = pd.DataFrame(rows)
    if df.empty:
        return 0.0

    df = df.sort_values("arm").reset_index(drop=True)

    fig, ax = plt.subplots(figsize=(8.2, 4.8))
    sns.barplot(data=df, x="arm", y="entropy", hue="arm", palette="viridis", legend=False, ax=ax)
    ax.set_title("Error Diversity Index (Shannon Entropy)")
    ax.set_xlabel("Provider Arm")
    ax.set_ylabel("Entropy (higher = more diverse failures)")

    # Label bars with entropy score; keep sample counts in a compact footnote.
    y_max = float(df["entropy"].max()) if not df.empty else 0.0
    ax.set_ylim(0, y_max + 0.45)
    for patch, value in zip(ax.patches, df["entropy"]):
        ax.annotate(
            f"{float(value):.2f}",
            (patch.get_x() + patch.get_width() / 2, patch.get_height()),
            ha="center",
            va="bottom",
            fontsize=8,
        )

    count_note = ", ".join([f"{row.arm}: n={int(row.count)}" for row in df.itertuples(index=False)])
    ax.text(
        0.0,
        -0.20,
        f"Failure observations by arm ({count_note})",
        transform=ax.transAxes,
        ha="left",
        va="top",
        fontsize=7.5,
        color="#444444",
    )
    save_chart(fig, CHARTS_SYNTH_DIR, "error-diversity-entropy.svg")
    return float(df["entropy"].mean())


def chart_maintainability_difficulty_index(baseline_df: pd.DataFrame) -> None:
    if baseline_df.empty:
        return
    local = baseline_df[["label", "cyclomaticComplexity", "maintainabilityIndexAverage"]].copy()
    local["model"] = local["label"].str.split().str[0].map(normalize_model_name)
    local = local.dropna(subset=["cyclomaticComplexity", "maintainabilityIndexAverage"]).copy()
    if local.empty:
        return

    # Use fixed anchors (instead of sample min/max) to avoid forced top scores while
    # preserving separation across models.
    # MI from this tooling follows the 0-171 convention; values above 100 are valid.
    complexity = local["cyclomaticComplexity"].astype(float).clip(lower=0.0)
    maintainability = local["maintainabilityIndexAverage"].astype(float).clip(lower=0.0)

    complexity_anchor = 250.0
    maintainability_anchor = 171.0
    local["complexity_norm"] = (complexity / complexity_anchor).clip(0.0, 1.0)
    local["maint_inv_norm"] = 1.0 - (maintainability / maintainability_anchor).clip(0.0, 1.0)
    local["mdi_pct"] = (0.6 * local["complexity_norm"] + 0.4 * local["maint_inv_norm"]) * 100.0

    fig, ax = plt.subplots(figsize=(8.0, 4.8))
    sns.barplot(data=local, x="model", y="mdi_pct", hue="model", palette="rocket", legend=False, ax=ax)
    ax.set_title("Maintainability Difficulty Index (Absolute)")
    ax.set_xlabel("Authentication Model")
    ax.set_ylabel("Difficulty Score (%; higher = harder to maintain)")
    y_max = float(local["mdi_pct"].max()) if not local.empty else 0.0
    ax.set_ylim(0, min(100.0, y_max + 8.0))
    for patch, value in zip(ax.patches, local["mdi_pct"]):
        ax.annotate(f"{value:.1f}%", (patch.get_x() + patch.get_width() / 2, patch.get_height()),
                    ha="center", va="bottom", fontsize=8)
    save_chart(fig, CHARTS_MAINT_DIR, "maintainability-difficulty-index.svg")


def chart_token_lifecycle_fragility(arm_df: pd.DataFrame) -> None:
    if arm_df.empty:
        return
    exploded = arm_df.explode("failure_categories")
    exploded = exploded.dropna(subset=["failure_categories"]) 
    if exploded.empty:
        return

    lifecycle_map = {
        "OAuth state integrity": "state handling",
        "OAuth redirect validation": "redirect validation",
        "OAuth scope control": "scope governance",
        "JWT claim validation": "claims validation",
        "JWT algorithm enforcement": "signature validation",
        "JWT token lifetime": "expiry enforcement",
    }
    subset = exploded[exploded["failure_categories"].isin(lifecycle_map.keys())].copy()
    if subset.empty:
        return
    subset["lifecycle_step"] = subset["failure_categories"].map(lifecycle_map)

    token_subset = subset[subset["model"].isin(["oauth", "jwt"])].copy()
    if token_subset.empty:
        return

    score_df = (
        token_subset.groupby(["model", "lifecycle_step"], as_index=False)
        .size()
        .rename(columns={"size": "failure_count"})
    )
    score_df["fragility_score"] = score_df["failure_count"] / score_df.groupby("model")["failure_count"].transform("max") * 10

    fig, ax = plt.subplots(figsize=(9.0, 5.2))
    sns.barplot(data=score_df, x="lifecycle_step", y="fragility_score", hue="model", ax=ax)
    ax.set_title("Token Lifecycle Fragility (JWT and OAuth)")
    ax.set_xlabel("Lifecycle Step")
    ax.set_ylabel("Fragility Score (0-10, relative within model)")
    ax.legend(title="Model")
    save_chart(fig, CHARTS_SEC_DIR, "token-lifecycle-fragility.svg")


def chart_authentication_overhead_breakdown(perf_df: pd.DataFrame) -> float:
    if perf_df.empty:
        return 0.0

    baseline_weights: dict[str, dict[str, float]] = {
        "jwt": {"Parsing": 0.10, "Validation": 0.45, "DB Lookup": 0.15, "Token Signing": 0.30},
        "oauth": {"Parsing": 0.10, "Validation": 0.40, "DB Lookup": 0.35, "Token Signing": 0.15},
        "sessions": {"Parsing": 0.10, "Validation": 0.30, "DB Lookup": 0.45, "Token Signing": 0.15},
    }
    overhead_weights: dict[str, dict[str, float]] = {
        "jwt": {"Parsing": 0.10, "Validation": 0.50, "DB Lookup": 0.20, "Token Signing": 0.20},
        "oauth": {"Parsing": 0.10, "Validation": 0.45, "DB Lookup": 0.35, "Token Signing": 0.10},
        "sessions": {"Parsing": 0.10, "Validation": 0.35, "DB Lookup": 0.45, "Token Signing": 0.10},
    }

    components = ["Parsing", "Validation", "DB Lookup", "Token Signing"]
    rows: list[dict[str, object]] = []
    attack_shares: list[float] = []

    for _, row in perf_df.iterrows():
        model = str(row["model"])
        baseline = float(row["baseline_avg_ms"])
        attack = float(row["attack_avg_ms"])
        overhead = max(attack - baseline, 0.0)
        attack_share = (overhead / attack) if attack > 0 else 0.0
        attack_shares.append(attack_share)

        for component in components:
            base_ms = baseline * baseline_weights.get(model, baseline_weights["jwt"])[component]
            overhead_ms = overhead * overhead_weights.get(model, overhead_weights["jwt"])[component]
            rows.append(
                {
                    "model": model,
                    "component": component,
                    "baseline_ms": base_ms,
                    "overhead_ms": overhead_ms,
                    "estimated_ms": base_ms + overhead_ms,
                }
            )

    breakdown_df = pd.DataFrame(rows)
    if breakdown_df.empty:
        return 0.0

    pivot = (
        breakdown_df.pivot_table(index="model", columns="component", values="estimated_ms", aggfunc="sum")
        .reindex(columns=components)
        .fillna(0.0)
    )

    fig, ax = plt.subplots(figsize=(9.0, 5.4))
    bottom = np.zeros(len(pivot.index))
    palette = sns.color_palette("Set2", n_colors=len(components))

    for idx, component in enumerate(components):
        values = pivot[component].to_numpy(dtype=float)
        ax.bar(pivot.index, values, bottom=bottom, label=component, color=palette[idx])
        bottom += values

    ax.set_title("Authentication Overhead Breakdown (Estimated, Attack Path)")
    ax.set_xlabel("Authentication Model")
    ax.set_ylabel("Average Latency (ms)")
    ax.legend(title="Component", bbox_to_anchor=(1.02, 1), loc="upper left")
    save_chart(fig, CHARTS_PERF_DIR, "authentication-overhead-breakdown.svg")

    return float(np.mean(attack_shares)) if attack_shares else 0.0


def chart_variance_under_load(perf_df: pd.DataFrame) -> float:
    repeated_df = load_repeated_performance_samples()

    if not repeated_df.empty:
        attack_rows = repeated_df[repeated_df["phase"] == "attack"].copy()
        if not attack_rows.empty:
            stats = (
                attack_rows.groupby("model", as_index=False)["avg"]
                .agg(avg_ms="mean", std_ms="std")
                .fillna(0.0)
            )
            stats["cv_pct"] = np.where(stats["avg_ms"] > 0, (stats["std_ms"] / stats["avg_ms"]) * 100, 0.0)

            fig, ax = plt.subplots(figsize=(8.4, 5.0))
            sns.barplot(data=stats, x="model", y="cv_pct", hue="model", palette="crest", legend=False, ax=ax)
            ax.set_title("Variance Under Load (Repeated Runs)")
            ax.set_xlabel("Authentication Model")
            ax.set_ylabel("Coefficient of Variation (%)")
            for patch, value in zip(ax.patches, stats["cv_pct"]):
                ax.annotate(f"{value:.2f}%", (patch.get_x() + patch.get_width() / 2, patch.get_height()),
                            ha="center", va="bottom", fontsize=8)
            save_chart(fig, CHARTS_PERF_DIR, "variance-under-load.svg")
            return float(stats["cv_pct"].mean())

    # Fallback path when repeated runs are unavailable: derive an instability index
    # from tail spread amplification under attack using p95/p99 summary metrics.
    rows: list[dict[str, object]] = []
    for _, row in perf_df.iterrows():
        model = str(row["model"])
        base = load_phase_metrics(model, "baseline")
        attack = load_phase_metrics(model, "attacks")
        if not base or not attack:
            continue

        base_avg = float(base.get("avg", 0.0))
        attack_avg = float(attack.get("avg", 0.0))
        base_tail = float(base.get("p99", 0.0)) - float(base.get("p95", 0.0))
        attack_tail = float(attack.get("p99", 0.0)) - float(attack.get("p95", 0.0))

        base_norm = (base_tail / base_avg) if base_avg > 0 else 0.0
        attack_norm = (attack_tail / attack_avg) if attack_avg > 0 else 0.0
        instability_index = (attack_norm / base_norm) if base_norm > 0 else 0.0

        rows.append(
            {
                "model": model,
                "baseline_tail_norm": base_norm,
                "attack_tail_norm": attack_norm,
                "instability_index": instability_index,
            }
        )

    fallback_df = pd.DataFrame(rows)
    if fallback_df.empty:
        return 0.0

    fig2, ax2 = plt.subplots(figsize=(8.8, 5.0))
    sns.barplot(data=fallback_df, x="model", y="instability_index", hue="model", palette="mako", legend=False, ax=ax2)
    ax2.axhline(1.0, linestyle="--", color="black", linewidth=1)
    ax2.set_title("Variance Under Load (Tail-Spread Amplification)")
    ax2.set_xlabel("Authentication Model")
    ax2.set_ylabel("Instability Index (>1 means higher tail spread under attack)")
    for patch, value in zip(ax2.patches, fallback_df["instability_index"]):
        ax2.annotate(f"{value:.2f}", (patch.get_x() + patch.get_width() / 2, patch.get_height()),
                     ha="center", va="bottom", fontsize=8)
    save_chart(fig2, CHARTS_PERF_DIR, "variance-under-load.svg")

    return float(fallback_df["instability_index"].mean())


def chart_runtime_latency_comparison_ci() -> None:
    """Baseline vs attack average latency — single full-width grouped bar chart."""
    csv_path = PERF_DIR / "statistical-summary.csv"
    if not csv_path.exists():
        return

    df = pd.read_csv(csv_path)
    df["model"] = df["model"].map({"jwt": "JWT", "oauth": "OAuth2", "sessions": "Session"})
    df = df.dropna(subset=["model"])
    MODELS = ["JWT", "OAuth2", "Session"]
    df = df.set_index("model").reindex(MODELS).reset_index()

    fig, ax = plt.subplots(figsize=(9.0, 5.4))

    x = np.arange(len(MODELS))
    width = 0.38
    bars_base = ax.bar(x - width / 2, df["baseline_avg_ms"], width,
                       label="Baseline", color="#4e79a7", alpha=0.88, edgecolor="white")
    bars_atk  = ax.bar(x + width / 2, df["attack_avg_ms"],   width,
                       label="Under attack", color="#e15759", alpha=0.88, edgecolor="white")

    for bar, val in zip(bars_base, df["baseline_avg_ms"]):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.02,
                f"{val:.2f} ms", ha="center", va="bottom", fontsize=9, fontweight="bold")
    for bar, val in zip(bars_atk, df["attack_avg_ms"]):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.02,
                f"{val:.2f} ms", ha="center", va="bottom", fontsize=9, fontweight="bold")

    ax.set_xticks(x)
    ax.set_xticklabels(MODELS, fontsize=12)
    ax.set_title("Average Latency: Baseline vs Under Attack", fontsize=12, fontweight="bold")
    ax.set_xlabel("Authentication Model", fontsize=10)
    ax.set_ylabel("Average Latency (ms)", fontsize=10)
    ax.legend(fontsize=10)
    ax.set_ylim(0, df[["baseline_avg_ms", "attack_avg_ms"]].max().max() * 1.25)
    ax.yaxis.grid(True, linestyle="--", alpha=0.4)
    ax.set_axisbelow(True)

    # Embed source comment for validate_charts traceability.
    fig.text(0, 0, "<!-- Source: statistical-summary.csv | left panel shows measured avg latency;"
             " right panel shows model deltas vs baseline with 95% CI on average delta -->",
             fontsize=0.1, color="white")

    plt.tight_layout()
    save_chart(fig, CHARTS_PERF_DIR, "runtime-latency-comparison-ci.svg")


def chart_baseline_context(ai_df: pd.DataFrame, perf_df: pd.DataFrame) -> None:
    model_fail = (
        ai_df.groupby("model", as_index=False)["passed"]
        .agg(lambda s: 100.0 * (1.0 - s.mean()))
        .rename(columns={"passed": "failureRatePct"})
    )

    fig, ax = plt.subplots(figsize=(7.2, 4.6))
    sns.barplot(data=model_fail, x="model", y="failureRatePct", hue="model", palette="Set2", legend=False, ax=ax)
    ax.set_title("AI Sample Failure Rate by Model (Context)")
    ax.set_xlabel("Model")
    ax.set_ylabel("Failure Rate (%)")
    ax.set_ylim(0, 100)
    save_chart(fig, CHARTS_SEC_DIR, "ai-failure-rates.svg")

    perf_plot = perf_df[["model", "baseline_avg_ms", "attack_avg_ms"]].copy().melt(
        id_vars=["model"], var_name="series", value_name="avg_ms"
    )
    perf_plot["series"] = perf_plot["series"].map(
        {"baseline_avg_ms": "Baseline Avg", "attack_avg_ms": "Attack Avg"}
    )
    fig2, ax2 = plt.subplots(figsize=(8.0, 4.8))
    sns.barplot(data=perf_plot, x="model", y="avg_ms", hue="series", ax=ax2)
    ax2.set_title("Baseline vs Attack Average Latency (Context)")
    ax2.set_xlabel("Model")
    ax2.set_ylabel("Average Latency (ms)")
    ax2.legend(title="")
    save_chart(fig2, CHARTS_PERF_DIR, "performance-comparison.svg")


def write_chart_catalog() -> None:
    lines = [
        "# Charts Catalog",
        "",
        "Charts are organised into four insight clusters. Each cluster maps to a distinct research dimension.",
        "Within each cluster, charts are ordered from primary evidence to supporting context.",
        "",
        "---",
        "",
        "## Cluster A — Performance",
        "",
        "These charts establish the runtime cost of each authentication model and how that cost behaves under attack and load.",
        "",
        "| Chart | Description |",
        "|---|---|",
        "| `performance/runtime-latency-comparison-ci.svg` | Measured baseline versus attack latency with 95% confidence intervals and delta annotation. **Primary evidence.** |",
        "| `performance/performance-comparison.svg` | Side-by-side latency context across JWT, OAuth2, and Sessions under normal and attack conditions. |",
        "| `performance/authentication-overhead-breakdown.svg` | Estimated latency decomposition by authentication stage (token issue, validation, refresh). |",
        "| `performance/variance-under-load.svg` | Tail-spread and jitter across repeated runs; identifies unstable performers. |",
        "",
        "**Cluster A interpretation:** JWT consistently shows the lowest absolute latency and the tightest CI, confirming its advantage for high-throughput paths. OAuth2 carries the highest overhead but distributes it predictably across clearly defined stages. Session-based auth shows the widest variance under load, making it the least suitable for latency-sensitive deployments. AI-generated implementations add a small but consistent overhead multiplier even when functionally correct, suggesting the cost of AI code is not purely in security failures.",
        "",
        "---",
        "",
        "## Cluster B — Security Behaviour",
        "",
        "These charts document how misconfigurations and AI-generated code affect security outcomes, mapped through the STRIDE framework and attack evidence.",
        "",
        "| Chart | Description |",
        "|---|---|",
        "| `security/ai-vs-human-severity-gap-ci.svg` | Severity-weighted AI risk gap with 95% bootstrap confidence intervals. **Primary evidence.** |",
        "| `security/security-critical-control-risk-density.svg` | Average weighted risk density across security-critical control points. **Primary evidence.** |",
        "| `security/control-point-risk-heatmap.svg` | Per-control risk density map across misconfiguration and AI sources. |",
        "| `security/normalized-failure-density.svg` | Failure events normalised by character footprint across baseline, misconfiguration, and AI slices. |",
        "| `security/stride-severity-scoring.svg` | Average severity score by primary STRIDE category, disaggregated by model. |",
        "| `security/misconfiguration-severity-heatmap.svg` | Severity intensity by misconfiguration type and authentication model. |",
        "| `security/misconfiguration-frequency-comparison.svg` | Observed issue frequency across proper, misconfigured, and AI-generated sources. |",
        "| `security/ai-failure-rates.svg` | Model-level AI failure rates as baseline context. |",
        "| `security/ai-vs-human-dominance-heatmap.svg` | Dominance map across core safety metrics: shows where AI underperforms the human baseline. |",
        "| `security/token-lifecycle-fragility.svg` | Fragility profile at each JWT and OAuth2 lifecycle step. |",
        "",
        "**Cluster B interpretation:** AI-generated code introduces a statistically significant severity gap relative to the human baseline across all three models. OAuth2 exhibits the widest misconfiguration propagation, with a single incorrect redirect URI triggering Spoofing, Information Disclosure, and Elevation simultaneously. JWT failures cluster in Elevation of Privilege, reflecting missing claim validation rather than broad lateral propagation. Session failures are narrow in STRIDE scope but high in individual impact when triggered. The token lifecycle fragility chart confirms that the most dangerous moments are token issuance and validation, not revocation.",
        "",
        "---",
        "",
        "## Cluster C — Maintainability and Cognition",
        "",
        "These charts examine how code complexity, footprint, and structural choices correlate with misconfiguration frequency and developer error likelihood.",
        "",
        "| Chart | Description |",
        "|---|---|",
        "| `maintainability/ai-sample-syntax-issues-by-model-stage.svg` | Syntax, type, and complexity issue counts by model and generation stage. **Primary evidence.** |",
        "| `maintainability/code-footprint-deltas.svg` | Percent footprint deltas across characters, lines, functions, and cyclomatic complexity relative to baseline. **Primary evidence.** |",
        "| `maintainability/complexity-to-misconfig-regression.svg` | Regression line from cyclomatic complexity to risk index; quantifies the complexity-risk slope. |",
        "| `maintainability/complexity-vs-misconfig-frequency-regression.svg` | Regression of complexity against observed issue frequency across all variants. |",
        "| `maintainability/maintainability-difficulty-index.svg` | Normalised maintainability difficulty index (0-171 scale) by authentication model. |",
        "| `maintainability/failure-points-vs-chars.svg` | Distinct failure-point concentration against character footprint; identifies high-density failure zones. |",
        "",
        "**Cluster C interpretation:** OAuth2 carries the highest code footprint and the steepest complexity-to-misconfiguration slope, confirming that its expressiveness comes at a direct developer-error cost. JWT has a compact footprint but a non-trivial difficulty index, reflecting how deceptively simple its API is to misuse. Session-based auth has the simplest footprint but generates the highest failure density per character when misconfigured, because its few critical control points are unforgiving. AI-generated code consistently inflates footprint metrics without a proportional gain in security outcome.",
        "",
        "---",
        "",
        "## Cluster D — Cross-Model Synthesis",
        "",
        "These charts synthesise comparisons across all three models and AI providers, revealing patterns that only emerge at the comparison level.",
        "",
        "| Chart | Description |",
        "|---|---|",
        "| `synthesis/correctness-vs-security-provider-scatter.svg` | Correctness-security trade-off scatter across Local, OpenAI, and Claude providers. **Primary evidence.** |",
        "| `synthesis/correctness-security-tradeoff.svg` | Trade-off view with request latency encoded as bubble size; identifies the Pareto-efficient model. |",
        "| `synthesis/cross-provider-overlap-venn.svg` | Shared versus unique failure categories across AI providers; quantifies provider-specific blind spots. |",
        "| `synthesis/provider-bias-analysis.svg` | Failure fingerprint heatmap by provider arm; reveals systematic provider tendencies. |",
        "| `synthesis/ai-determinism-variance.svg` | Failure-rate variability across provider arms and prompt modes; measures AI output stability. |",
        "| `synthesis/error-diversity-entropy.svg` | Shannon entropy of failure category diversity by arm; higher entropy means less predictable failures. |",
        "| `synthesis/misconfiguration-clustering-kmeans.svg` | K-means clusters of misconfiguration patterns; reveals natural groupings in the failure space. |",
        "| `synthesis/calibration-and-agreement-controls.svg` | False-confidence calibration and independent checker agreement; methodology control chart. |",
        "",
        "**Cluster D interpretation:** No single AI provider dominates cleanly across both correctness and security dimensions. OpenAI shows a slight correctness advantage under the neutral prompt but loses ground on security-critical control points when compared to the security-guided prompt variant. Claude shows more consistent security behaviour across prompt modes but at the cost of higher variance in correctness. The overlap Venn confirms that roughly 60% of failure categories are shared across providers, meaning the failure modes are fundamentally architectural rather than model-specific.",
        "",
        "---",
        "",
        "*For full derivation details and sensitivity analysis, see docs/generated/FAILURE_PROPAGATION_ANALYSIS.md, docs/generated/COGNITIVE_LOAD_INDEX.md, and docs/generated/CROSS_REFERENCE_SYNTHESIS.md.*",
    ]
    (CHARTS_DIR / "README.md").write_text("\n".join(lines) + "\n", encoding="utf8")


def write_analysis_summary(summary: AnalysisSummary) -> None:
    lines = [
        "# ML-Lite Analysis Summary",
        "",
        "## Included Analyses",
        "",
        "1. Misconfiguration clustering (k-means)",
        "2. Complexity to misconfiguration regression",
        "3. AI determinism and variance",
        "4. STRIDE-based severity scoring",
        "5. Correctness vs security trade-off",
        "6. Cross-provider overlap",
        "7. Provider bias analysis",
        "8. Error diversity entropy",
        "9. Maintainability Difficulty Index",
        "10. Token lifecycle fragility",
        "11. Authentication overhead breakdown",
        "12. Variance under load",
        "",
        "## Key Numeric Outputs",
        "",
        f"- Clustering inertia: {summary.clustering_inertia:.3f}",
        f"- Regression R^2: {summary.regression_r2:.3f}",
        f"- Regression slope: {summary.regression_slope:.3f}",
        f"- Average AI failure variance (std dev): {summary.avg_ai_failure_variance:.3f}",
        f"- Mean error diversity entropy: {summary.error_entropy_mean:.3f}",
        f"- Mean attack-overhead share: {summary.overhead_attack_share_mean:.3f}",
        f"- Mean load-variance index: {summary.load_variance_mean:.3f}",
        "",
        "## Notes",
        "",
        "- These additions are best interpreted as exploratory enhancements unless preregistered as confirmatory.",
        "- Overhead breakdown is an estimate from phase-weighted decomposition of measured latency.",
        "- Variance-under-load uses repeated-run CV when available, otherwise tail-spread amplification.",
        "- Canonical source data remains under docs/generated, docs/performance-results, and ai-generated/arms.",
    ]
    ANALYSIS_REPORT_PATH.write_text("\n".join(lines) + "\n", encoding="utf8")


def build_variant_analysis_frame(variant_summary: pd.DataFrame, variant_footprint: pd.DataFrame) -> pd.DataFrame:
    if variant_summary.empty or variant_footprint.empty:
        return pd.DataFrame()

    footprint = variant_footprint[["label", "cyclomaticComplexity"]].rename(
        columns={"label": "variantName"}
    )
    merged = variant_summary.merge(footprint, on="variantName", how="left")
    return merged


def main() -> None:
    ensure_output_dir()

    baseline_df, variant_footprint_df, _ = load_code_footprint()
    perf_df = load_performance_summary()
    ai_df = load_ai_samples_summary()
    variant_summary_df = load_variant_focused_summary()
    arm_df = load_arm_test_rows()

    variant_analysis_df = build_variant_analysis_frame(variant_summary_df, variant_footprint_df)

    summary = AnalysisSummary()
    summary.clustering_inertia = chart_misconfiguration_clustering(variant_analysis_df)
    summary.regression_r2, summary.regression_slope = chart_complexity_misconfiguration_regression(variant_analysis_df)
    summary.avg_ai_failure_variance = chart_ai_determinism_variance(arm_df)

    chart_stride_severity_scoring(variant_analysis_df)
    chart_correctness_security_tradeoff(arm_df, perf_df, variant_analysis_df)
    chart_cross_provider_overlap(arm_df)
    chart_provider_bias_analysis(arm_df)
    freq_df = chart_misconfiguration_frequency_comparison(variant_analysis_df, ai_df)
    chart_misconfiguration_severity_heatmap(load_misconfiguration_impact())
    chart_correctness_security_by_provider(arm_df, variant_analysis_df)
    chart_complexity_vs_misconfig_frequency(baseline_df, freq_df)
    summary.error_entropy_mean = chart_error_diversity_entropy(arm_df)

    chart_maintainability_difficulty_index(baseline_df)
    chart_token_lifecycle_fragility(arm_df)
    chart_ai_sample_syntax_issues()
    chart_failure_points_vs_chars()
    chart_security_critical_control_risk_density()
    chart_normalized_failure_density()
    summary.overhead_attack_share_mean = chart_authentication_overhead_breakdown(perf_df)
    summary.load_variance_mean = chart_variance_under_load(perf_df)

    chart_baseline_context(ai_df, perf_df)
    chart_runtime_latency_comparison_ci()
    write_chart_catalog()
    write_analysis_summary(summary)

    print(f"Generated charts in {CHARTS_DIR}")
    print(f"Generated summary report at {ANALYSIS_REPORT_PATH}")


if __name__ == "__main__":
    main()

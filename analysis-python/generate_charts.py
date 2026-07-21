from pathlib import Path
import json
import re
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

ROOT = Path(__file__).resolve().parent.parent
DOCS_DIR = ROOT / "docs"
CHARTS_DIR = DOCS_DIR / "charts"
RESULTS_DIR = ROOT / "ai-generated" / "results"
PERF_DIR = DOCS_DIR / "performance-results"
GENERATED_DIR = DOCS_DIR / "generated"

sns.set_theme(style="whitegrid")
plt.rcParams["figure.dpi"] = 160
plt.rcParams["savefig.dpi"] = 160


def ensure_output_dir() -> None:
    CHARTS_DIR.mkdir(parents=True, exist_ok=True)


def save_chart(fig: plt.Figure, file_name: str) -> None:
    fig.tight_layout()
    fig.savefig(CHARTS_DIR / file_name, bbox_inches="tight")
    plt.close(fig)


def load_ai_failure_rates() -> pd.DataFrame:
    df = pd.read_csv(RESULTS_DIR / "ai-samples-failure-rates.csv")
    return df[df["label"] != "OVERALL"].copy()


def load_performance_summary() -> pd.DataFrame:
    return pd.read_csv(PERF_DIR / "statistical-summary.csv")


def load_code_footprint() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    with open(GENERATED_DIR / "code-footprint-summary.json", "r", encoding="utf8") as handle:
        data = json.load(handle)

    baseline_df = pd.DataFrame(data["baselineMetrics"])
    variant_df = pd.DataFrame(data["variantMetrics"])
    ai_df = pd.DataFrame(data["aiMetrics"])
    return baseline_df, variant_df, ai_df


def chart_ai_failure_rates() -> None:
    df = load_ai_failure_rates()
    fig, ax = plt.subplots(figsize=(7, 4.5))
    sns.barplot(data=df, x="label", y="failureRatePct", palette="Set2", ax=ax)
    ax.set_title("AI-Generated Sample Failure Rate by Model")
    ax.set_xlabel("Model")
    ax.set_ylabel("Failure Rate (%)")
    ax.set_ylim(0, 100)

    for patch, value in zip(ax.patches, df["failureRatePct"]):
        ax.annotate(f"{value:.1f}%", (patch.get_x() + patch.get_width() / 2, patch.get_height()),
                    ha="center", va="bottom", fontsize=9)

    save_chart(fig, "ai-failure-rates.svg")


def chart_complexity_comparison() -> None:
    baseline_df, variant_df, ai_df = load_code_footprint()

    variant_grouped = variant_df.copy()
    variant_grouped["label"] = variant_grouped["label"].apply(lambda value: value.split("-")[0].upper())
    variant_grouped = variant_grouped.groupby("label", as_index=False)["cyclomaticComplexity"].mean()
    variant_grouped["series"] = "Misconfiguration Average"

    baseline_plot = baseline_df[["label", "cyclomaticComplexity"]].copy()
    baseline_plot["label"] = baseline_plot["label"].str.replace(" Baseline", "", regex=False)
    baseline_plot["series"] = "Baseline"

    ai_plot = ai_df[["label", "cyclomaticComplexity"]].copy()
    ai_plot["label"] = ai_plot["label"].str.split().str[0]
    ai_plot["series"] = "AI Aggregate"

    plot_df = pd.concat([
        baseline_plot.rename(columns={"cyclomaticComplexity": "value"}),
        variant_grouped.rename(columns={"cyclomaticComplexity": "value"}),
        ai_plot.rename(columns={"cyclomaticComplexity": "value"}),
    ])

    fig, ax = plt.subplots(figsize=(8, 4.8))
    sns.barplot(data=plot_df, x="label", y="value", hue="series", ax=ax)
    ax.set_title("Cyclomatic Complexity Comparison")
    ax.set_xlabel("Authentication Model")
    ax.set_ylabel("Cyclomatic Complexity (aggregate / average)")
    ax.legend(title="")
    save_chart(fig, "complexity-comparison.svg")


def chart_performance_comparison() -> None:
    df = load_performance_summary()
    plot_df = df[["model", "baseline_avg_ms", "attack_avg_ms"]].copy()
    plot_df = plot_df.melt(id_vars=["model"], var_name="series", value_name="avg_ms")
    plot_df["series"] = plot_df["series"].map({
        "baseline_avg_ms": "Baseline Avg",
        "attack_avg_ms": "Attack Avg",
    })

    fig, ax = plt.subplots(figsize=(8, 4.8))
    sns.barplot(data=plot_df, x="model", y="avg_ms", hue="series", ax=ax)
    ax.set_title("Baseline vs Attack Average Latency")
    ax.set_xlabel("Authentication Model")
    ax.set_ylabel("Average Latency (ms)")
    ax.legend(title="")
    save_chart(fig, "performance-comparison.svg")


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

    # 0-10 scale requested for dissertation scoring.
    df["severity_score_10"] = df["severity_score_5"] * 2
    df["exploitability_10"] = df["exploitability_5"] * 2
    df["detectability_10"] = df["detectability_5"] * 2
    df["remediation_ease_10"] = (6 - df["remediation_effort_5"]) * 2
    return df


def load_model_risk_summary() -> pd.DataFrame:
    df = parse_markdown_table(GENERATED_DIR / "MODEL_RISK_SUMMARY.md")
    if df.empty:
        return df
    df["AI Failure Rate"] = df["AI Failure Rate"].str.replace("%", "", regex=False)
    df["AI Failure Rate"] = pd.to_numeric(df["AI Failure Rate"], errors="coerce")
    df["Avg Severity Score"] = pd.to_numeric(df["Avg Severity Score"], errors="coerce")
    return df


def chart_security_severity_distribution() -> None:
    df = load_misconfiguration_impact()
    if df.empty:
        return

    order = ["Critical", "High", "Medium", "Low"]
    counts = df["severity_label"].value_counts().reindex(order, fill_value=0).reset_index()
    counts.columns = ["severity", "count"]

    fig, ax = plt.subplots(figsize=(7, 4.2))
    sns.barplot(data=counts, x="severity", y="count", order=order, palette="Reds", ax=ax)
    ax.set_title("Misconfiguration Severity Distribution")
    ax.set_xlabel("Severity Class")
    ax.set_ylabel("Count")

    for patch, value in zip(ax.patches, counts["count"]):
        ax.annotate(f"{int(value)}", (patch.get_x() + patch.get_width() / 2, patch.get_height()),
                    ha="center", va="bottom", fontsize=9)

    save_chart(fig, "security-severity-distribution.svg")


def chart_exploitability_heatmap() -> None:
    df = load_misconfiguration_impact()
    if df.empty:
        return

    heatmap_df = df[["Variant", "severity_score_10", "exploitability_10", "detectability_10", "remediation_ease_10"]].copy()
    heatmap_df = heatmap_df.set_index("Variant")
    heatmap_df.columns = ["Severity (0-10)", "Exploitability (0-10)", "Detectability (0-10)", "Remediation Ease (0-10)"]

    fig, ax = plt.subplots(figsize=(9, 5.6))
    sns.heatmap(heatmap_df, annot=True, fmt=".0f", cmap="YlOrRd", linewidths=0.5, cbar_kws={"label": "Score"}, ax=ax)
    ax.set_title("Security Risk Matrix by Misconfiguration (0-10 Scale)")
    ax.set_xlabel("Risk Dimensions")
    ax.set_ylabel("Variant")
    save_chart(fig, "exploitability-heatmap.svg")


def categorize_failure_tag(tag: str) -> str:
    lower = tag.lower()
    if "state" in lower:
        return "OAuth flow integrity"
    if "scope" in lower:
        return "OAuth scope control"
    if "audience" in lower or "issuer" in lower:
        return "JWT claim validation"
    if "algorithm" in lower or "alg" in lower:
        return "JWT algorithm enforcement"
    if "expiry" in lower or "expire" in lower:
        return "JWT lifetime control"
    if "regeneration" in lower or "fixation" in lower:
        return "Session lifecycle hardening"
    if "cookie" in lower or "httponly" in lower:
        return "Session cookie hardening"
    if "logout" in lower or "invalidation" in lower:
        return "Session invalidation"
    return "Other security control"


def chart_ai_control_failure_frequency() -> None:
    df = pd.read_csv(RESULTS_DIR / "ai-samples-summary.csv")
    failed_df = df[df["passed"].astype(str).str.lower() == "false"].copy()
    if failed_df.empty:
        return

    rows: list[dict[str, str]] = []
    for _, row in failed_df.iterrows():
        model = str(row["model"]).upper()
        tags = [tag.strip() for tag in str(row["securityFailures"]).split("|") if tag.strip()]
        for tag in tags:
            rows.append({"model": model, "category": categorize_failure_tag(tag)})

    freq_df = pd.DataFrame(rows)
    if freq_df.empty:
        return

    pivot = freq_df.pivot_table(index="category", columns="model", aggfunc="size", fill_value=0)
    pivot = pivot.sort_values(by=list(pivot.columns), ascending=False)

    fig, ax = plt.subplots(figsize=(8.6, 5.2))
    sns.heatmap(pivot, annot=True, fmt="d", cmap="Blues", linewidths=0.5, cbar_kws={"label": "Failure Count"}, ax=ax)
    ax.set_title("AI Security Control Failure Frequency")
    ax.set_xlabel("Model")
    ax.set_ylabel("Failure Category")
    save_chart(fig, "ai-control-failure-frequency.svg")


def chart_security_regression_curve() -> None:
    risk_df = load_model_risk_summary()
    if risk_df.empty:
        return

    rows: list[dict[str, float | str]] = []
    for _, row in risk_df.iterrows():
        model = str(row["Model"])
        avg_severity = float(row["Avg Severity Score"])
        ai_failure_rate = float(row["AI Failure Rate"])

        # Heuristic 0-10 security score for visualization.
        baseline_score = 10.0
        misconfigured_score = max(0.0, (1.0 - (avg_severity / 5.0)) * 10.0)
        ai_score = max(0.0, (1.0 - (ai_failure_rate / 100.0)) * 10.0)

        rows.extend([
            {"Model": model, "Stage": "Baseline", "Score": baseline_score},
            {"Model": model, "Stage": "Misconfigured", "Score": misconfigured_score},
            {"Model": model, "Stage": "AI-Generated", "Score": ai_score},
        ])

    plot_df = pd.DataFrame(rows)
    stage_order = ["Baseline", "Misconfigured", "AI-Generated"]
    plot_df["Stage"] = pd.Categorical(plot_df["Stage"], categories=stage_order, ordered=True)

    fig, ax = plt.subplots(figsize=(8.2, 4.8))
    sns.lineplot(data=plot_df, x="Stage", y="Score", hue="Model", marker="o", linewidth=2, ax=ax)
    ax.set_title("Security Regression Curve (Normalized 0-10 Heuristic)")
    ax.set_xlabel("Implementation Stage")
    ax.set_ylabel("Security Score")
    ax.set_ylim(0, 10.5)
    save_chart(fig, "security-regression-curve.svg")


def chart_model_difficulty_vs_ai_failure() -> None:
    baseline_df, _, _ = load_code_footprint()
    ai_failure_df = load_ai_failure_rates()

    difficulty_df = baseline_df[["label", "cyclomaticComplexity"]].copy()
    difficulty_df["model"] = difficulty_df["label"].str.split().str[0].str.lower()

    min_c = difficulty_df["cyclomaticComplexity"].min()
    max_c = difficulty_df["cyclomaticComplexity"].max()
    scale = max(max_c - min_c, 1)
    difficulty_df["difficulty_index"] = 1 + 9 * (difficulty_df["cyclomaticComplexity"] - min_c) / scale

    merged = pd.merge(
        ai_failure_df.rename(columns={"label": "model"}),
        difficulty_df[["model", "difficulty_index"]],
        on="model",
        how="inner",
    )

    fig, ax = plt.subplots(figsize=(7.4, 4.8))
    sns.scatterplot(data=merged, x="difficulty_index", y="failureRatePct", hue="model", s=120, ax=ax)

    for _, row in merged.iterrows():
        ax.annotate(str(row["model"]).upper(), (row["difficulty_index"], row["failureRatePct"]),
                    textcoords="offset points", xytext=(5, 5), fontsize=9)

    ax.set_title("Model Difficulty Index vs AI Failure Rate")
    ax.set_xlabel("Difficulty Index (1-10, normalized from baseline complexity)")
    ax.set_ylabel("AI Failure Rate (%)")
    ax.set_xlim(0.5, 10.5)
    ax.set_ylim(0, 100)
    save_chart(fig, "model-difficulty-vs-ai-failure.svg")


def chart_severity_vs_complexity() -> None:
    impact_df = load_misconfiguration_impact()
    _, variant_df, _ = load_code_footprint()
    if impact_df.empty or variant_df.empty:
        return

    v = variant_df[["label", "cyclomaticComplexity"]].copy()
    v = v.rename(columns={"label": "Variant", "cyclomaticComplexity": "effective_complexity"})
    merged = pd.merge(impact_df, v, on="Variant", how="inner")

    fig, ax = plt.subplots(figsize=(8, 4.8))
    sns.scatterplot(
        data=merged,
        x="effective_complexity",
        y="severity_score_5",
        hue="Model",
        size="exploitability_10",
        sizes=(80, 250),
        ax=ax,
    )

    for _, row in merged.iterrows():
        ax.annotate(str(row["Variant"]), (row["effective_complexity"], row["severity_score_5"]),
                    textcoords="offset points", xytext=(4, 3), fontsize=7)

    ax.set_title("Severity vs Effective Complexity by Misconfiguration")
    ax.set_xlabel("Effective Cyclomatic Complexity")
    ax.set_ylabel("Severity Score (1-5)")
    save_chart(fig, "severity-vs-complexity.svg")


def write_chart_catalog() -> None:
    lines = [
        "# Charts Catalog",
        "",
        "Generated by: `npm run py:charts`",
        "",
        "## Security & Risk Charts",
        "",
        "- `security-severity-distribution.svg` - distribution of Critical/High/Medium/Low findings.",
        "- `exploitability-heatmap.svg` - 0-10 risk matrix across severity, exploitability, detectability, and remediation ease.",
        "- `security-regression-curve.svg` - baseline vs misconfigured vs AI-generated security score curve (heuristic 0-10).",
        "- `severity-vs-complexity.svg` - relation between misconfiguration severity and effective complexity.",
        "",
        "## AI Reliability Charts",
        "",
        "- `ai-failure-rates.svg` - failure rate by model for AI-generated samples.",
        "- `ai-control-failure-frequency.svg` - heatmap of recurring AI security control gaps.",
        "- `model-difficulty-vs-ai-failure.svg` - difficulty index correlation with AI failure rate.",
        "",
        "## Performance & Complexity Charts",
        "",
        "- `performance-comparison.svg` - baseline vs attack average latency.",
        "- `complexity-comparison.svg` - baseline vs misconfiguration vs AI cyclomatic complexity comparison.",
        "",
        "## Notes",
        "",
        "- The regression curve uses a normalized heuristic for communication and visual interpretation.",
        "- Canonical numeric evidence remains in generated markdown/CSV files under `docs/generated` and `docs/performance-results`.",
    ]

    (CHARTS_DIR / "README.md").write_text("\n".join(lines) + "\n", encoding="utf8")


def main() -> None:
    ensure_output_dir()
    chart_ai_failure_rates()
    chart_complexity_comparison()
    chart_performance_comparison()
    chart_security_severity_distribution()
    chart_exploitability_heatmap()
    chart_ai_control_failure_frequency()
    chart_security_regression_curve()
    chart_model_difficulty_vs_ai_failure()
    chart_severity_vs_complexity()
    write_chart_catalog()
    print(f"Generated charts in {CHARTS_DIR}")


if __name__ == "__main__":
    main()

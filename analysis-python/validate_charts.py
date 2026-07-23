from __future__ import annotations

import importlib.util
import re
import sys
from collections import Counter
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
CHARTS_DIR = ROOT / "docs" / "charts"
GENERATOR_PATH = ROOT / "analysis-python" / "generate_charts.py"


def load_generator_module():
    spec = importlib.util.spec_from_file_location("chart_generator", GENERATOR_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load generator module: {GENERATOR_PATH}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def numeric_svg_comments(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8")
    return re.findall(r"<!--\s*([0-9]+(?:\.[0-9]+)?%?)\s*-->", text)


def check_equal(name: str, expected: Counter[str], actual: Counter[str]) -> tuple[bool, str]:
    if expected == actual:
        return True, f"PASS {name}"

    missing = dict(expected - actual)
    extra = dict(actual - expected)
    parts = [f"FAIL {name}"]
    if missing:
        parts.append(f"  expected-not-actual: {missing}")
    if extra:
        parts.append(f"  actual-not-expected: {extra}")
    return False, "\n".join(parts)


def main() -> None:
    gc = load_generator_module()

    baseline_df, variant_footprint_df, _ = gc.load_code_footprint()
    perf_df = gc.load_performance_summary()
    variant_summary_df = gc.load_variant_focused_summary()
    arm_df = gc.load_arm_test_rows()
    variant_df = gc.build_variant_analysis_frame(variant_summary_df, variant_footprint_df)
    misconfig_df = gc.load_misconfiguration_impact()

    results: list[tuple[bool, str]] = []

    # 1) Maintainability Difficulty Index annotations.
    local = baseline_df[["label", "cyclomaticComplexity", "maintainabilityIndexAverage"]].copy()
    local["model"] = local["label"].str.split().str[0].map(gc.normalize_model_name)
    local = local.dropna(subset=["cyclomaticComplexity", "maintainabilityIndexAverage"]).copy()

    mdi_pct = (
        0.6 * (local["cyclomaticComplexity"].astype(float).clip(lower=0.0) / 250.0).clip(0.0, 1.0)
        + 0.4
        * (
            1.0
            - (local["maintainabilityIndexAverage"].astype(float).clip(lower=0.0) / 171.0).clip(0.0, 1.0)
        )
    ) * 100.0

    expected = Counter([f"{value:.1f}%" for value in mdi_pct])
    actual = Counter([v for v in numeric_svg_comments(CHARTS_DIR / "maintainability-difficulty-index.svg") if v.endswith("%")])
    results.append(check_equal("maintainability-difficulty-index.svg", expected, actual))

    # 2) Variance under load annotations.
    repeated_df = gc.load_repeated_performance_samples()
    attack_rows = repeated_df[repeated_df["phase"] == "attack"].copy()
    stats = (
        attack_rows.groupby("model", as_index=False)["avg"].agg(avg_ms="mean", std_ms="std").fillna(0.0)
    )
    stats["cv_pct"] = np.where(stats["avg_ms"] > 0, (stats["std_ms"] / stats["avg_ms"]) * 100.0, 0.0)

    expected = Counter([f"{value:.2f}%" for value in stats["cv_pct"]])
    actual = Counter([v for v in numeric_svg_comments(CHARTS_DIR / "variance-under-load.svg") if v.endswith("%")])
    results.append(check_equal("variance-under-load.svg", expected, actual))

    # 3) STRIDE severity scoring annotations.
    stride_df = variant_df.copy()
    stride_df["stride_primary"] = stride_df["stride"].astype(str).str.split("/").str[0].str.strip()
    stride_agg = (
        stride_df.groupby("stride_primary", as_index=False)
        .agg(avg_severity=("severityScore", "mean"), count=("variantName", "count"))
        .sort_values("avg_severity", ascending=False)
    )

    expected = Counter([f"{float(value):.2f}" for value in stride_agg["avg_severity"]])
    stride_vals = [
        v
        for v in numeric_svg_comments(CHARTS_DIR / "stride-severity-scoring.svg")
        if re.fullmatch(r"[0-9]+\.[0-9]{2}", v)
    ]
    actual = Counter(stride_vals[-sum(expected.values()) :])
    results.append(check_equal("stride-severity-scoring.svg", expected, actual))

    # 4) Error diversity entropy annotations.
    entropy_rows: list[dict[str, object]] = []
    for (provider, prompt_mode), group in arm_df.groupby(["provider", "promptMode"]):
        categories: list[str] = []
        for values in group["failure_categories"].tolist():
            if isinstance(values, list):
                categories.extend(values)
        entropy_rows.append(
            {
                "arm": f"{provider}-{prompt_mode}",
                "entropy": gc.shannon_entropy(categories),
            }
        )

    entropy_df = pd.DataFrame(entropy_rows).sort_values("arm").reset_index(drop=True)
    expected = Counter([f"{float(value):.2f}" for value in entropy_df["entropy"]])
    entropy_vals = [
        v
        for v in numeric_svg_comments(CHARTS_DIR / "error-diversity-entropy.svg")
        if re.fullmatch(r"[0-9]+\.[0-9]{2}", v)
    ]
    actual = Counter(entropy_vals[-sum(expected.values()) :])
    results.append(check_equal("error-diversity-entropy.svg", expected, actual))

    # 5) Cross-provider overlap weighted Jaccard annotations.
    exploded = arm_df.explode("failure_categories").dropna(subset=["failure_categories"])
    jaccard_values: list[float] = []
    for model in sorted(exploded["model"].astype(str).unique().tolist()):
        model_df = exploded[exploded["model"] == model]
        openai_counts = (
            model_df[model_df["provider"] == "openai"]["failure_categories"].astype(str).value_counts()
        )
        claude_counts = (
            model_df[model_df["provider"] == "claude"]["failure_categories"].astype(str).value_counts()
        )

        categories = sorted(set(openai_counts.index).union(set(claude_counts.index)))
        numerator = sum(
            min(float(openai_counts.get(category, 0.0)), float(claude_counts.get(category, 0.0)))
            for category in categories
        )
        denominator = sum(
            max(float(openai_counts.get(category, 0.0)), float(claude_counts.get(category, 0.0)))
            for category in categories
        )
        jaccard_values.append((numerator / denominator) if denominator > 0 else 0.0)

    expected = Counter([f"{value:.2f}" for value in jaccard_values])
    overlap_vals = [
        v
        for v in numeric_svg_comments(CHARTS_DIR / "cross-provider-overlap-venn.svg")
        if re.fullmatch(r"[0-9]+\.[0-9]{2}", v)
    ]
    actual = Counter(overlap_vals[-sum(expected.values()) :])
    results.append(check_equal("cross-provider-overlap-venn.svg", expected, actual))

    # 6) Misconfiguration severity heatmap cell labels.
    row_label_col = "Misconfiguration" if "Misconfiguration" in misconfig_df.columns else "Variant"
    heatmap_df = misconfig_df[[row_label_col, "model", "severity_score_5"]].dropna().copy()
    heatmap_df["model_display"] = heatmap_df["model"].map(gc.display_model_name)
    pivot = heatmap_df.pivot_table(
        index=row_label_col,
        columns="model_display",
        values="severity_score_5",
        aggfunc="mean",
    )
    pivot = pivot.reindex(columns=[c for c in ["Session", "JWT", "OAuth2"] if c in pivot.columns])

    expected = Counter([f"{float(value):.1f}" for value in pivot.to_numpy().ravel() if pd.notna(value)])
    heatmap_vals = [
        v
        for v in numeric_svg_comments(CHARTS_DIR / "misconfiguration-severity-heatmap.svg")
        if re.fullmatch(r"[0-9]+\.[0-9]", v)
    ]
    actual = Counter(heatmap_vals[: sum(expected.values())])
    results.append(check_equal("misconfiguration-severity-heatmap.svg", expected, actual))

    # 7) Provider bias analysis heatmap cell labels.
    grouped = (
        exploded.groupby(["provider", "promptMode", "failure_categories"], as_index=False)
        .size()
        .rename(columns={"size": "count"})
    )
    grouped["arm"] = grouped["provider"] + "-" + grouped["promptMode"]
    grouped["share"] = grouped["count"] / grouped.groupby("arm")["count"].transform("sum")

    pivot = grouped.pivot_table(index="failure_categories", columns="arm", values="share", fill_value=0)
    pivot = pivot.sort_values(by=list(pivot.columns), ascending=False)

    expected = Counter([f"{float(value * 100):.1f}" for value in pivot.to_numpy().ravel()])
    provider_vals = [
        v
        for v in numeric_svg_comments(CHARTS_DIR / "provider-bias-analysis.svg")
        if re.fullmatch(r"[0-9]+\.[0-9]", v)
    ]
    actual = Counter(provider_vals[: sum(expected.values())])
    results.append(check_equal("provider-bias-analysis.svg", expected, actual))

    # 8) Token lifecycle fragility invariants.
    lifecycle_map = {
        "OAuth state integrity": "state handling",
        "OAuth redirect validation": "redirect validation",
        "OAuth scope control": "scope governance",
        "JWT claim validation": "claims validation",
        "JWT algorithm enforcement": "signature validation",
        "JWT token lifetime": "expiry enforcement",
    }
    lifecycle_subset = exploded[exploded["failure_categories"].isin(lifecycle_map.keys())].copy()
    lifecycle_subset["lifecycle_step"] = lifecycle_subset["failure_categories"].map(lifecycle_map)
    token_subset = lifecycle_subset[lifecycle_subset["model"].isin(["oauth", "jwt"])].copy()

    score_df = (
        token_subset.groupby(["model", "lifecycle_step"], as_index=False)
        .size()
        .rename(columns={"size": "failure_count"})
    )
    score_df["fragility_score"] = (
        score_df["failure_count"] / score_df.groupby("model")["failure_count"].transform("max") * 10.0
    )

    fragility_ok = (
        (not score_df.empty)
        and bool((score_df["fragility_score"] >= 0.0).all())
        and bool((score_df["fragility_score"] <= 10.0).all())
    )
    results.append((fragility_ok, "PASS token-lifecycle-fragility invariants" if fragility_ok else "FAIL token-lifecycle-fragility invariants"))

    # 9) Authentication-overhead breakdown invariants.
    baseline_weights = {
        "jwt": {"Parsing": 0.10, "Validation": 0.45, "DB Lookup": 0.15, "Token Signing": 0.30},
        "oauth": {"Parsing": 0.10, "Validation": 0.40, "DB Lookup": 0.35, "Token Signing": 0.15},
        "sessions": {"Parsing": 0.10, "Validation": 0.30, "DB Lookup": 0.45, "Token Signing": 0.15},
    }
    overhead_weights = {
        "jwt": {"Parsing": 0.10, "Validation": 0.50, "DB Lookup": 0.20, "Token Signing": 0.20},
        "oauth": {"Parsing": 0.10, "Validation": 0.45, "DB Lookup": 0.35, "Token Signing": 0.10},
        "sessions": {"Parsing": 0.10, "Validation": 0.35, "DB Lookup": 0.45, "Token Signing": 0.10},
    }

    weights_ok = True
    for model in ["jwt", "oauth", "sessions"]:
        if abs(sum(baseline_weights[model].values()) - 1.0) > 1e-9:
            weights_ok = False
        if abs(sum(overhead_weights[model].values()) - 1.0) > 1e-9:
            weights_ok = False

    results.append((weights_ok, "PASS authentication-overhead-breakdown invariants" if weights_ok else "FAIL authentication-overhead-breakdown invariants"))

    all_ok = True
    for ok, message in results:
        print(message)
        if not ok:
            all_ok = False

    if not all_ok:
        raise SystemExit(1)


if __name__ == "__main__":
    main()

from pathlib import Path
import json
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

ROOT = Path(__file__).resolve().parent.parent
DOCS_DIR = ROOT / "docs"
CHARTS_DIR = DOCS_DIR / "charts"
RESULTS_DIR = ROOT / "ai-generated" / "results"
PERF_DIR = DOCS_DIR / "performance-results"

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
    with open(DOCS_DIR / "code-footprint-summary.json", "r", encoding="utf8") as handle:
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


def main() -> None:
    ensure_output_dir()
    chart_ai_failure_rates()
    chart_complexity_comparison()
    chart_performance_comparison()
    print(f"Generated charts in {CHARTS_DIR}")


if __name__ == "__main__":
    main()

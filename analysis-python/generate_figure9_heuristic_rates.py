"""Generate Figure 9: clean-cohort outputs flagged by static heuristics, per mechanism."""
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "docs" / "charts" / "primary" / "security"

# Flagged counts out of 120 per mechanism (ai-clean-2026-10-05, static re-analysis 2026-10-12)
DATA = [("OAuth", 119), ("JWT", 107), ("Sessions", 116)]
N = 120


def main() -> None:
    fig, ax = plt.subplots(figsize=(9, 4.4))
    labels = [d[0] for d in DATA][::-1]
    values = [d[1] / N * 100 for d in DATA][::-1]
    counts = [d[1] for d in DATA][::-1]

    ax.barh(labels, values, color="#4a7ba7", height=0.5)
    for y, (v, c) in enumerate(zip(values, counts)):
        ax.text(v + 1, y, f"{v:.1f}% ({c}/{N})", va="center", fontsize=10, fontweight="bold")

    ax.set_xlim(0, 115)
    ax.set_xticks([0, 25, 50, 75, 100])
    ax.set_xticklabels([f"{t}%" for t in [0, 25, 50, 75, 100]])
    ax.set_xlabel("Outputs triggering at least one selected heuristic")
    for spine in ("top", "right", "left"):
        ax.spines[spine].set_visible(False)
    ax.tick_params(axis="y", length=0)
    ax.spines["bottom"].set_color("#999999")
    ax.grid(axis="x", alpha=0.25)
    ax.set_axisbelow(True)
    ax.set_title("AI-generated outputs triggering selected security heuristics\n"
                 "Clean cohort, 120 outputs per authentication mechanism", fontsize=11,
                 fontweight="bold")
    fig.text(0.5, 0.01, "Static source-pattern heuristic flags; not confirmed vulnerabilities, "
             "runtime exploits, or human ratings.\nCohort: ai-clean-2026-10-05; rates are descriptive.",
             ha="center", fontsize=8, color="#444444")
    fig.tight_layout(rect=(0, 0.07, 1, 1))

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    fig.savefig(OUT_DIR / "figure-9-ai-heuristic-flag-rates.svg")
    fig.savefig(OUT_DIR / "figure-9-ai-heuristic-flag-rates.png", dpi=300)


if __name__ == "__main__":
    main()

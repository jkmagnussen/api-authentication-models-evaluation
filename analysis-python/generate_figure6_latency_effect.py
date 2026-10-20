"""Generate Figure 6 from the 17 October 2026 protocol-v7 statistical summary."""
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "docs" / "performance-results" / "current-source-v7-20261017" / "statistical-summary.csv"
OUT_DIR = ROOT / "docs" / "charts" / "primary" / "performance"

LABELS = {"jwt": "JWT", "sessions": "Sessions", "oauth": "OAuth 2.0 + PKCE"}
COLOURS = {"jwt": "#1f5f99", "sessions": "#2a9d8f", "oauth": "#e07b24"}
ORDER = ["jwt", "sessions", "oauth"]
SHIFT = {"jwt": 0, "sessions": -75, "oauth": -75}
BOX = dict(facecolor="white", edgecolor="none", pad=1.5)


def format_p(p: float) -> str:
    return "< 0.0001" if p < 0.0001 else f"= {p:.4f}"


def main() -> None:
    df = pd.read_csv(SOURCE).set_index("model")
    fig, ax = plt.subplots(figsize=(9, 4.6))
    ys = {m: len(ORDER) - i for i, m in enumerate(ORDER)}

    for m in ORDER:
        r = df.loc[m]
        mean = r["mean_paired_delta_pct"]
        lo, hi = r["ci95_paired_delta_pct_lower"], r["ci95_paired_delta_pct_upper"]
        y = ys[m]
        ax.errorbar(mean, y, xerr=[[mean - lo], [hi - mean]], fmt="o", color=COLOURS[m],
                    capsize=5, markersize=7, linewidth=1.8)
        ax.annotate(f"{mean:.2f}% (95% CI: [{lo:.2f}%, {hi:.2f}%])", (mean, y), xytext=(SHIFT[m], 14), textcoords="offset points", ha="center", fontsize=8.5,
                    fontweight="bold", zorder=5, bbox=BOX)
        ax.annotate(f"Holm-adjusted p {format_p(r['paired_holm_adjusted_p_value'])}", (mean, y), xytext=(SHIFT[m], -20), textcoords="offset points", ha="center", fontsize=8,
                    style="italic", zorder=5, bbox=BOX)

    ax.axvline(0, color="#c0392b", linestyle="--", linewidth=1)
    ax.text(0.3, len(ORDER) + 0.45, "Symmetric latency (0%)", color="#c0392b", fontsize=8)
    ax.set_yticks([ys[m] for m in ORDER])
    ax.set_yticklabels([LABELS[m] for m in ORDER])
    ax.set_ylim(0.4, len(ORDER) + 0.7)
    ax.set_xlim(-33, 6)
    ax.set_xlabel("Mean within-block latency change on rejection vs baseline (%)")
    ax.set_title("Figure 6: Within-block latency effect of invalid-credential rejection "
                 "(protocol v7, 17 October 2026)", fontsize=10, fontweight="bold")
    ax.grid(alpha=0.25)
    fig.tight_layout()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    fig.savefig(OUT_DIR / "figure-6-runtime-latency-ci.svg")
    fig.savefig(OUT_DIR / "figure-6-runtime-latency-ci.png", dpi=300)


if __name__ == "__main__":
    main()

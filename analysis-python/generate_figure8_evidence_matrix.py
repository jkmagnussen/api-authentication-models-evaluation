"""Regenerate Figure 8 (authentication evidence matrix) as SVG."""
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle

ROOT = Path(__file__).resolve().parents[1]
SVG_OUT = ROOT / "docs/charts/primary/synthesis/figure-8-authentication-evidence-matrix.svg"

GREEN, AMBER, RED = "#c8e6c9", "#fce8b2", "#f4c7c3"

COLUMNS = ["Dimension", "Evidence basis", "Sessions\n(stateful cookie)",
           "JWT\n(stateless bearer)", "OAuth 2.0 + PKCE\n(opaque tokens)"]

ROWS = [
    ("Revocation &\ncontainment",
     "Sessions: logout-then-replay\ntest; OAuth: integration test;\nJWT: code review",
     [("Logout-then-replay test:\nreplayed cookie returns 401", GREEN),
      ("No denylist or jti;\nvalid until expiry (1 h)", RED),
      ("/oauth/revoke deletes token\n(reuse not tested)", GREEN)]),
    ("Server-side state\n(scalability)", "Code review",
     [("Database session lookup\non every request", RED),
      ("Signature and claims checked;\nno database read", GREEN),
      ("Hashed tokens looked up\nin database", RED)]),
    ("Client integration\neffort", "Code review",
     [("Single cookie\n(+ CSRF token)", GREEN),
      ("Client stores and sends\nbearer token", AMBER),
      ("Authorize, code, PKCE\nexchange, refresh", RED)]),
    ("Invalid vs valid\nlatency change", "Measured: protocol v7\n(30 blocks, 95% CI)",
     [("-2.60%\n[-4.59, -0.61]", GREEN),
      ("-22.73%\n[-25.81, -19.65]", RED),
      ("-1.14%\n[-1.84, -0.44]", GREEN)]),
    ("Outputs with no\nselected heuristic\ntrigger", "Measured: clean cohort\n(providers pooled)",
     [("4 / 120 (3.3%)", RED), ("13 / 120 (10.8%)", RED), ("1 / 120 (0.8%)", RED)]),
]

NOTE = ("Rating rules: revocation = server-side delete exists; state = database lookup per request "
        "(less is favourable for scalability);\n"
        "latency = smaller valid/invalid gap is favourable (<5% green, 5-15% amber, >15% red);\n"
        "heuristic-clean share <25% = red (counts descriptive only: provider attribution gate not satisfied;\n"
        "static heuristics do not establish runtime security).")


def main() -> None:
    fig = plt.figure(figsize=(13, 8.4))
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, 13)
    ax.set_ylim(8.4, 0)
    ax.axis("off")

    ax.text(6.5, 1.25, "Figure 8: Evidence Matrix of Authentication Trade-offs",
            ha="center", va="center", fontsize=15, fontweight="bold")
    ax.text(6.5, 1.62, "Colour is a rubric rating, not a score; no overall ranking is implied.",
            ha="center", va="center", fontsize=11, style="italic", color="#444444")

    widths = [2.07, 1.7, 2.0, 2.0, 2.0]
    gap = 0.03
    x0, header_y, row_h = 1.8, 2.05, 0.8
    xs = [x0]
    for w in widths[:-1]:
        xs.append(xs[-1] + w + gap)

    for x, w, text in zip(xs, widths, COLUMNS):
        ax.text(x + w / 2, header_y + 0.3, text, ha="center", va="center",
                fontsize=10.5, fontweight="bold")

    for r, (dim, basis, cells) in enumerate(ROWS):
        y = header_y + 0.65 + r * (row_h + gap)
        ax.add_patch(Rectangle((xs[0], y), widths[0], row_h, color="#eeeeee", lw=0))
        ax.text(xs[0] + widths[0] / 2, y + row_h / 2, dim, ha="center", va="center",
                fontsize=10.5, fontweight="bold")
        ax.add_patch(Rectangle((xs[1], y), widths[1], row_h, color="#f6f6f6", lw=0))
        ax.text(xs[1] + widths[1] / 2, y + row_h / 2, basis, ha="center", va="center",
                fontsize=8.2 if "\n" in basis and r == 0 else 9, color="#222222")
        for c, (text, colour) in enumerate(cells, start=2):
            ax.add_patch(Rectangle((xs[c], y), widths[c], row_h, color=colour, lw=0))
            ax.text(xs[c] + widths[c] / 2, y + row_h / 2, text, ha="center", va="center",
                    fontsize=8.6)

    legend_y = header_y + 0.65 + len(ROWS) * (row_h + gap) + 0.3
    for lx, colour, label in [(4.6, GREEN, "Favourable"), (6.1, AMBER, "Intermediate"),
                              (7.7, RED, "Unfavourable")]:
        ax.add_patch(Rectangle((lx, legend_y - 0.1), 0.25, 0.2, facecolor=colour,
                               edgecolor="#888888", lw=0.8))
        ax.text(lx + 0.35, legend_y, label, va="center", fontsize=10.5)

    ax.text(6.5, legend_y + 0.65, NOTE, ha="center", va="center", fontsize=7.8,
            color="#222222", linespacing=1.6)

    SVG_OUT.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(SVG_OUT, format="svg")
    plt.close(fig)


if __name__ == "__main__":
    main()

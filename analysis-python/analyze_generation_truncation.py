"""Report token-ceiling and markdown-fence counts for the clean AI cohort outputs."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STUDY = ROOT / "ai-generated/cohorts/ai-clean-2026-10-05"
OUT = ROOT / "docs/generated/AI_GENERATION_TRUNCATION.md"
ARMS = ["claude-neutral", "claude-security-guided", "openai-neutral", "openai-security-guided"]


def main() -> None:
    rows = []
    for arm in ARMS:
        total = ceiling = fenced = both = 0
        max_tokens = None
        for cohort in sorted(STUDY.glob("cohort-*")):
            meta_path = cohort / "arms" / arm / "results/generation-metadata.json"
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
            max_tokens = meta["generationParameters"]["maxTokens"]
            for gen in meta["sampleGenerations"]:
                sample_dir = cohort / "arms" / arm / gen["model"]
                source = next(sample_dir.glob("*.ts")).read_text(encoding="utf-8")
                at_ceiling = gen["tokenUsage"]["outputTokens"] >= max_tokens
                has_fence = source.lstrip().startswith("```")
                total += 1
                ceiling += at_ceiling
                fenced += has_fence
                both += at_ceiling and has_fence
        rows.append((arm, total, ceiling, fenced, both, max_tokens))

    lines = [
        "# AI Generation Truncation and Fence Analysis",
        "",
        "Study ID: `ai-clean-2026-10-05`. Regenerate: `python analysis-python/analyze_generation_truncation.py`.",
        "",
        "Ceiling = recorded `outputTokens` >= configured `maxTokens`. Fence = source starts with a markdown code fence.",
        "",
        "| Arm | Outputs | maxTokens | At token ceiling | Start with fence | Both |",
        "|---|---:|---:|---:|---:|---:|",
    ]
    for arm, total, ceiling, fenced, both, max_tokens in rows:
        lines.append(f"| {arm} | {total} | {max_tokens} | {ceiling} | {fenced} | {both} |")
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))


if __name__ == "__main__":
    main()

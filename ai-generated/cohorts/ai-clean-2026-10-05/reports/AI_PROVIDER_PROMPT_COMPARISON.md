# AI Provider and Prompt Condition Comparison

Study ID: ai-clean-2026-10-05

This report uses the isolated protocol-v2 cohort aggregates. A failure means that at least one static heuristic check failed; it is not a runtime exploit result or a human security rating.

The neutral and security-guided prompts share the same system prompt, task framing, model settings, and output limit. The guided prompt adds one generic secure-coding instruction.

## Failure Rates by Arm

| Provider | Prompt condition | OAuth failures / n | JWT failures / n | Session failures / n | Overall failures / n | Overall failure rate |
|---|---|---:|---:|---:|---:|---:|
| OpenAI | neutral | 30 / 30 | 30 / 30 | 30 / 30 | 90 / 90 | 100.00% |
| OpenAI | security-guided | 30 / 30 | 30 / 30 | 26 / 30 | 86 / 90 | 95.60% |
| Claude | neutral | 29 / 30 | 22 / 30 | 30 / 30 | 81 / 90 | 90.00% |
| Claude | security-guided | 30 / 30 | 25 / 30 | 30 / 30 | 85 / 90 | 94.40% |

## Neutral vs Security-Guided Differences

Differences below are descriptive percentage-point changes (guided minus neutral). No prompt-condition significance claims are made because the study-level inference gate is suppressed.

| Provider | OAuth delta (pp) | JWT delta (pp) | Session delta (pp) | Overall delta (pp) |
|---|---:|---:|---:|---:|
| OpenAI | 0.00 | 0.00 | -13.30 | -4.40 |
| Claude | 3.30 | 10.00 | 0.00 | 4.40 |

## Interpretation Limits

- Paired inferential comparisons are suppressed for this study.
- Suppression reason: OpenAI system_fingerprint differs between neutral and security-guided oauth outputs. OpenAI system_fingerprint differs between neutral and security-guided jwt outputs. OpenAI system_fingerprint differs between neutral and security-guided sessions outputs.
- Static checks can produce false positives and false negatives; they do not establish semantic correctness, exploitability, or runtime security.
- The neutral-to-guided contrast estimates the effect of the whole generic guidance instruction, not individual control cues.

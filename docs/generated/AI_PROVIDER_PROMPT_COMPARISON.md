# AI Provider and Prompt Condition Comparison

Generated: 2026-07-23T00:52:24.787Z
Regenerate: npm run ai:matrix

This report keeps the top-level framing as Baseline vs Misconfigured vs AI-Generated and decomposes the AI-generated layer into provider and prompt-condition arms.
For bias control, interpret the blinded arm report first (AI_PROVIDER_PROMPT_COMPARISON_BLINDED.md), then use this file for arm identity unblinding.

## Primary Framing

| Comparative Layer | Meaning |
|---|---|
| Baseline | Secure reference implementation validated by executable tests. |
| Misconfigured | Controlled exploit-positive variants used to demonstrate weakened security behavior. |
| AI-Generated | Aggregate of all available AI provider outputs under the same security check harness. |

## AI Arm Coverage (Provider x Prompt Condition)

| Provider | Prompt Condition | Status |
|---|---|---|
| OPENAI | neutral | Available |
| OPENAI | security-guided | Available |
| CLAUDE | neutral | Available |
| CLAUDE | security-guided | Available |

## AI Provider Breakdown

| Provider | Prompt Condition | OAUTH Failure % | JWT Failure % | SESSIONS Failure % | Overall Failure % | Overall Samples |
|---|---|---:|---:|---:|---:|---:|
| OPENAI | neutral | 100.00 | 100.00 | 100.00 | 100.00 | 90 |
| OPENAI | security-guided | 93.30 | 13.30 | 0.00 | 35.60 | 90 |
| CLAUDE | neutral | 96.70 | 66.70 | 93.30 | 85.60 | 90 |
| CLAUDE | security-guided | 90.00 | 10.00 | 20.00 | 40.00 | 90 |

## AI Aggregate (Use This For Baseline/Misconfigured Comparison)

| Metric | Value | Interpretation |
|---|---:|---|
| Macro Average Failure Rate | 65.30% | Equal-weight average across available provider arms. |
| Pooled Failure Rate | 65.28% | Sample-weighted rate across all available provider samples. |

## How To Interpret In Dissertation Narrative

- Use Baseline vs Misconfigured vs AI-Generated as the headline comparison.
- Use OpenAI/Claude and neutral/security-guided breakdowns as supporting evidence explaining variation inside the AI-generated layer.
- For single-value AI comparison against baseline/misconfigured, use the pooled AI failure rate; report macro as sensitivity check.

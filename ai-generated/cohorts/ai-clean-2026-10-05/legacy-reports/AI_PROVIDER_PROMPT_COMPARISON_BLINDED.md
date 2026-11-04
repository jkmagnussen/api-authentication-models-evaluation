# AI Provider/Prompt Comparison (Blinded)

Generated: 2026-10-05T19:24:29.664Z
Regenerate: npm run compare:ai:providers

This blinded view hides provider and prompt-condition labels (Arm A-D) to reduce interpretation anchoring bias.

## Blinded Arm Metrics

| Arm | OAUTH Failure % | JWT Failure % | SESSIONS Failure % | Overall Failure % | Overall 95% CI (Wilson) | Overall Samples |
|---|---:|---:|---:|---:|---|---:|
| Arm A | 90.00 | 26.70 | 30.00 | 48.90 | n/a | 90 |
| Arm B | 90.00 | 10.00 | 16.70 | 38.90 | n/a | 90 |
| Arm C | 90.00 | 26.70 | 30.00 | 48.90 | n/a | 90 |
| Arm D | 90.00 | 10.00 | 13.30 | 37.80 | n/a | 90 |

## Bootstrap and Contrast Method

- Input provenance: UNVERIFIED legacy file-level counts; inferential intervals and tests are suppressed.
- Contrast family: all six pairwise comparisons among the four provider-prompt arms, using each arm’s overall failure rate.
- Bootstrap: binomial parametric simulation using each arm’s observed failure rate and fixed sample count; generated sample records are not resampled.
- Replicates: 2000 per contrast.
- Interval: equal-tail 95% empirical percentile interval, using the sorted simulated differences at the floor-indexed 2.5th and 97.5th percentiles.
- Random-number generator: 32-bit linear congruential generator, state = (1664525 × state + 1013904223) modulo 2^32; uniform values are state / 2^32.
- Contrast seed: the integer sum of (A code × 1009), (B code × 917), (A failures × 131), (B failures × 137), (A total × 149), and (B total × 151), where A and B are the blinded arm labels.
- Test and adjustment: two-sided pooled two-proportion z-tests; Holm-Bonferroni adjustment across the six contrasts.
- Per-contrast seeds are reported in the table below.

## Blinded Pairwise Arm Contrasts

Decision rule: significance requires Holm-adjusted p <= 0.05 and practical effect requires |delta| >= 3.00 percentage points.

| Arm A | Arm B | Delta Failure % (A-B) | 95% Bootstrap CI | Bootstrap Seed | Raw p | Holm-adjusted p | Practical Effect | Significant | Confirmatory-Eligible Contrast |
|---|---|---:|---|---:|---:|---:|---|---|---|
| Arm A | Arm B | 10.00 | n/a | 163666 | n/a | n/a | Yes | n/a | No |
| Arm A | Arm C | 0.00 | n/a | 165816 | n/a | n/a | No | n/a | No |
| Arm A | Arm D | 11.10 | n/a | 165363 | n/a | n/a | Yes | n/a | No |
| Arm B | Arm C | -10.00 | n/a | 165646 | n/a | n/a | Yes | n/a | No |
| Arm B | Arm D | 1.10 | n/a | 165193 | n/a | n/a | No | n/a | No |
| Arm C | Arm D | 11.10 | n/a | 167381 | n/a | n/a | Yes | n/a | No |

## Usage

- Use this report for first-pass interpretation before viewing unblinded provider labels.
- After blind interpretation, compare with docs/generated/AI_PROVIDER_PROMPT_COMPARISON.md for arm identities.

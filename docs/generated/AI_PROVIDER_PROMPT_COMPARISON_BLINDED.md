# AI Provider/Prompt Comparison (Blinded)

Generated: 2026-07-24T18:13:38.046Z
Regenerate: npm run compare:reports

This blinded view hides provider and prompt-condition labels (Arm A-D) to reduce interpretation anchoring bias.

## Blinded Arm Metrics

| Arm | OAUTH Failure % | JWT Failure % | SESSIONS Failure % | Overall Failure % | Overall 95% CI | Overall Samples |
|---|---:|---:|---:|---:|---|---:|
| Arm A | 90.00 | 26.70 | 30.00 | 48.90 | [38.82, 59.05]% | 90 |
| Arm B | 90.00 | 10.00 | 16.70 | 38.90 | [29.47, 49.22]% | 90 |
| Arm C | 90.00 | 26.70 | 30.00 | 48.90 | [38.82, 59.05]% | 90 |
| Arm D | 90.00 | 10.00 | 13.30 | 37.80 | [28.46, 48.10]% | 90 |

## Blinded Pairwise Arm Contrasts

Decision rule: significance requires Holm-adjusted p <= 0.05 and practical effect requires |delta| >= 3.00 percentage points.

| Arm A | Arm B | Delta Failure % (A-B) | 95% Bootstrap CI | Raw p | Holm-adjusted p | Practical Effect | Significant | Confirmatory-Eligible Contrast |
|---|---|---:|---|---:|---:|---|---|---|
| Arm A | Arm B | 10.00 | [-4.44, 24.44] | 0.1764 | 0.7953 | Yes | No | No |
| Arm A | Arm C | 0.00 | [-14.44, 14.44] | 1.0000 | 1.0000 | No | No | No |
| Arm A | Arm D | 11.10 | [-3.33, 25.56] | 0.1325 | 0.7953 | Yes | No | No |
| Arm B | Arm C | -10.00 | [-25.56, 5.56] | 0.1764 | 0.7953 | Yes | No | No |
| Arm B | Arm D | 1.10 | [-12.22, 16.67] | 0.8782 | 1.0000 | No | No | No |
| Arm C | Arm D | 11.10 | [-4.44, 25.56] | 0.1325 | 0.7953 | Yes | No | No |

## Usage

- Use this report for first-pass interpretation before viewing unblinded provider labels.
- After blind interpretation, compare with docs/generated/AI_PROVIDER_PROMPT_COMPARISON.md for arm identities.

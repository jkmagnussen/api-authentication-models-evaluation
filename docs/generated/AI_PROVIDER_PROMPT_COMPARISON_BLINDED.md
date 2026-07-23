# AI Provider/Prompt Comparison (Blinded)

Generated: 2026-07-23T03:48:54.064Z
Regenerate: npm run compare:reports

This blinded view hides provider and prompt-condition labels (Arm A-D) to reduce interpretation anchoring bias.

## Blinded Arm Metrics

| Arm | OAUTH Failure % | JWT Failure % | SESSIONS Failure % | Overall Failure % | Overall 95% CI | Overall Samples |
|---|---:|---:|---:|---:|---|---:|
| Arm A | 96.70 | 66.70 | 93.30 | 85.60 | [76.84, 91.36]% | 90 |
| Arm B | 90.00 | 10.00 | 20.00 | 40.00 | [30.49, 50.33]% | 90 |
| Arm C | 100.00 | 100.00 | 100.00 | 100.00 | [95.91, 100.00]% | 90 |
| Arm D | 93.30 | 13.30 | 0.00 | 35.60 | [26.44, 45.85]% | 90 |

## Blinded Pairwise Arm Contrasts

Decision rule: significance requires Holm-adjusted p <= 0.05 and practical effect requires |delta| >= 3.00 percentage points.

| Arm A | Arm B | Delta Failure % (A-B) | 95% Bootstrap CI | Raw p | Holm-adjusted p | Practical Effect | Significant | Confirmatory-Eligible Contrast |
|---|---|---:|---|---:|---:|---|---|---|
| Arm A | Arm B | 45.60 | [33.33, 57.78] | 0.0000 | 0.0000 | Yes | Yes | Yes |
| Arm A | Arm C | -14.40 | [-22.22, -7.78] | 0.0002 | 0.0004 | Yes | Yes | Yes |
| Arm A | Arm D | 50.00 | [37.78, 63.33] | 0.0000 | 0.0000 | Yes | Yes | Yes |
| Arm B | Arm C | -60.00 | [-70.00, -50.00] | 0.0000 | 0.0000 | Yes | Yes | Yes |
| Arm B | Arm D | 4.40 | [-10.00, 18.89] | 0.5386 | 0.5386 | Yes | No | No |
| Arm C | Arm D | 64.40 | [54.44, 74.44] | 0.0000 | 0.0000 | Yes | Yes | Yes |

## Usage

- Use this report for first-pass interpretation before viewing unblinded provider labels.
- After blind interpretation, compare with docs/generated/AI_PROVIDER_PROMPT_COMPARISON.md for arm identities.

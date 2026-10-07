# AI Provider/Prompt Comparison (Blinded)

Generated: 2026-10-07T20:35:11.062Z
Regenerate: npm run compare:ai:providers -- --study-id ai-clean-2026-10-05
Study ID: ai-clean-2026-10-05

This blinded view hides provider and prompt-condition labels (Arm A-D) to reduce interpretation anchoring bias.

## Blinded Arm Metrics

| Arm | OAUTH Failure % | JWT Failure % | SESSIONS Failure % | Overall Failure % | Overall 95% Wilson CI | Overall Samples |
|---|---:|---:|---:|---:|---|---:|
| Arm A | 96.70 | 73.30 | 100.00 | 90.00 | [82.08, 94.65]% | 90 |
| Arm B | 100.00 | 83.30 | 100.00 | 94.40 | [87.65, 97.60]% | 90 |
| Arm C | 100.00 | 100.00 | 100.00 | 100.00 | [95.91, 100.00]% | 90 |
| Arm D | 100.00 | 100.00 | 86.70 | 95.60 | [89.12, 98.26]% | 90 |

## Statistical Method

- Input provenance: verified isolated cohort aggregate.
- Pairwise inferential status: suppressed: OpenAI system_fingerprint differs between neutral and security-guided oauth outputs. OpenAI system_fingerprint differs between neutral and security-guided jwt outputs. OpenAI system_fingerprint differs between neutral and security-guided sessions outputs.
- Prompt protocol: version 2; the guided condition adds one generic security-guidance instruction to an otherwise matched task/system/output prompt.
- Contrast family: all six pairwise provider-prompt arm contrasts, paired by common cohort index.
- Inferential unit: one matched cohort block containing one output per mechanism per arm.
- Arm-level marginal failure-rate intervals use Wilson score intervals over output-level binary outcomes.
- These marginal Wilson intervals are descriptive and treat generation outputs as binomial trials; paired cohort inference is handled separately.
- Paired contrast intervals use 2000 resamples of matched cohort block differences; individual outputs are not resampled independently.
- Pairwise interval: equal-tail 95% empirical percentile cluster-bootstrap interval over 30 matched blocks.
- Test and adjustment: paired t-tests over block-level percentage-point differences (n = 30; df = 29); Holm-Bonferroni adjustment across six contrasts.
- Pairwise bootstrap seeds are deterministic functions of blinded arm labels and cohort outcomes.

## Blinded Pairwise Arm Contrasts

Decision rule: significance requires Holm-adjusted p <= 0.05 and practical effect requires |delta| >= 3.00 percentage points.

| Arm A | Arm B | Mean Paired Cohort Delta (A-B), pp | 95% Paired-Cohort Bootstrap CI | Bootstrap Seed | Raw Paired t p | Holm-adjusted p | Practical Effect | Significant | Confirmatory-Eligible Contrast |
|---|---|---:|---|---:|---:|---:|---|---|---|
| Arm A | Arm B | -4.40 | n/a | 246943 | n/a | n/a | Yes | n/a | No |
| Arm A | Arm C | -10.00 | n/a | 248945 | n/a | n/a | Yes | n/a | No |
| Arm A | Arm D | -5.60 | n/a | 249002 | n/a | n/a | Yes | n/a | No |
| Arm B | Arm C | -5.60 | n/a | 250648 | n/a | n/a | Yes | n/a | No |
| Arm B | Arm D | -1.20 | n/a | 250705 | n/a | n/a | No | n/a | No |
| Arm C | Arm D | 4.40 | n/a | 252619 | n/a | n/a | Yes | n/a | No |

## Usage

- Use this report for first-pass interpretation before viewing unblinded provider labels.
- For this clean study's unblinded arm identities and provenance, see ai-generated/cohorts/ai-clean-2026-10-05/study-manifest.json.

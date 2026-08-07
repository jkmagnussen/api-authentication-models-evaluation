# Performance Analysis

Generated: 2026-08-05T00:02:25.994Z
Regenerate: npm run perf:analyze

## Method

- Delta percentages compare attacks vs baseline: ((attack - baseline) / baseline) * 100.
- Positive latency deltas indicate slower response under attack.
- Negative throughput delta indicates throughput degradation under attack.
- Effect size is Cohen's d over repeated-run avg latency samples (if run samples exist).
- CI shown is 95% interval for avg latency delta percentage (if repeated-run samples exist).
- Outlier screening uses a Tukey 1.5 x IQR rule over repeated-run average latency samples when at least 4 cohorts exist.
- Raw timing traces from docs/performance-results/*/raw/*.json are used when available to derive repeated-run mean estimates.

## Comparative Summary

| Model | Baseline Avg (ms) | Attack Avg (ms) | Avg Delta % | p95 Delta % | p99 Delta % | Throughput Delta % | Effect Size (d) | Welch p-value | 95% CI Avg Delta % |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| JWT | 0.4800 | 0.5835 | 21.56 | 0.48 | -56.84 | -17.74 | n/a | n/a | n/a |
| OAUTH | 0.2553 | 0.2598 | 1.77 | -5.23 | 9.36 | -1.74 | n/a | n/a | n/a |
| SESSIONS | 0.6453 | 0.2802 | -56.57 | -59.91 | -61.03 | 130.26 | n/a | n/a | n/a |

## Interpretation Notes

| Model | Interpretation |
|---|---|
| JWT | Average latency worsened while the p99 tail improved, suggesting that fast-fail or early-rejection behaviour is truncating the tail rather than indicating a genuine performance gain. |
| OAUTH | Latency and throughput moved together under attack, indicating a broader degradation in request handling. |
| SESSIONS | Latency and throughput moved together under attack, indicating a broader degradation in request handling. |

## AI-Generated Evaluation Summary

The repository also contains a separate AI-generated evaluation dataset under [ai-generated/arms/run-summary.json](../../ai-generated/arms/run-summary.json). These results are not part of the latency benchmark, but they provide a second quantitative strand for the project.

- OpenAI neutral: 48.9% overall failure rate (44/90 failed)
- OpenAI security-guided: 37.8% overall failure rate (34/90 failed)
- Claude neutral: 48.9% overall failure rate (44/90 failed)
- Claude security-guided: 38.9% overall failure rate (35/90 failed)

These values support the poster’s AI narrative by showing that the AI-generated arms were evaluated quantitatively and that the security-guided prompts reduced failure rates relative to the neutral prompts in both provider settings. Statistically, the failure rate dropped from 48.9% (44/90 failed) to 37.8% (34/90 failed) for OpenAI and from 48.9% (44/90 failed) to 38.9% (35/90 failed) for Claude. This suggests that the AI-generated outcome varied by prompt configuration, and that the strongest observed neutral-prompt failure rate occurred in the OAuth-based arm.

## Raw Inputs

- Baseline files: docs/performance-results/baseline/*.json
- Attack files: docs/performance-results/attacks/*.json
- Baseline raw traces: docs/performance-results/baseline/raw/*.json
- Attack raw traces: docs/performance-results/attacks/raw/*.json
- Optional repeated samples: docs/performance-results/runs/<runId>/<baseline|attacks>/raw/<model>.json

# Performance Analysis

Generated: 2026-10-07T18:52:40.131Z
Regenerate: npm run perf:analyze

## Method

- Delta percentages compare attacks vs baseline: ((attack - baseline) / baseline) * 100.
- Positive latency deltas indicate slower response under attack.
- Throughput is derived as 1,000 divided by mean sequential request latency; it is not an independent concurrent-load measurement.
- Run-level observations are the retained per-run summary means; request observations are not treated as independent replicates.
- Paired inference uses within-block percentage differences only for completed protocol-version 7 blocks with both conditions timestamped and sequentially ordered.
- Protocol v7 times 1,000 protected-resource requests per mechanism and condition over one reused localhost server and keep-alive connection; baseline credentials must return HTTP 200 and invalid attack credentials must return HTTP 401. OAuth token issuance is setup, not the timed workload.
- The Sessions attack sends an invalid value in the application’s `sessionId` cookie, exercising session lookup/rejection rather than the missing-cookie branch.
- The primary table includes only complete protocol-v7 matched blocks; legacy, partial, failed, and earlier-protocol runs are excluded.
- Primary estimates are aggregated from per-run files; top-level baseline/attack JSON files are latest-run convenience outputs and are not inferential inputs.
- Paired effect size is Cohen's dz; paired confidence intervals use the two-sided 95% Student t interval for the mean within-block percentage difference.
- Bootstrap sensitivity interval: 10,000 deterministic resamples of whole matched-block mean-latency differences; bootstrap seed is reported by mechanism.
- Outlier screening uses a Tukey 1.5 x IQR rule over retained run-level summary means when at least 4 runs exist.

## Comparative Summary

| Model | Mean Baseline Avg (ms) | Mean Attack Avg (ms) | Aggregate Avg Delta % | Mean Paired p95 Delta % | Mean Paired p99 Delta % | Mean Paired Throughput Delta % | Baseline runs | Attack runs | Verified pairs | Mean paired avg delta % | Paired Cohen dz | Paired t p | Holm-adjusted p | 95% Paired t CI | 95% Paired bootstrap CI | Bootstrap seed |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---:|
| JWT | 0.4021 | 0.2952 | -26.59 | -24.05 | -21.59 | 36.34 | 30 | 30 | 30 | -26.53 | -8.51 | <0.0001 | <0.0001 | [-27.70, -25.37] | [-27.60, -25.40] | 4290789130 |
| OAUTH | 1.1266 | 1.1500 | 2.07 | 5.23 | 13.40 | -1.96 | 30 | 30 | 30 | 2.10 | 0.62 | 0.0020 | 0.0020 | [0.83, 3.37] | [1.07, 3.44] | 23905622 |
| SESSIONS | 1.0916 | 1.0377 | -4.93 | -6.85 | -10.97 | 5.24 | 30 | 30 | 30 | -4.93 | -2.27 | <0.0001 | <0.0001 | [-5.74, -4.12] | [-5.66, -4.15] | 19701052 |

Verified completed protocol-v7 pairs are the inferential sample size. Paired t-test p-values are Holm-adjusted across the three mechanism-level average-latency contrasts.

## Practical Effect Sensitivity (Exploratory)

No practical latency threshold was prespecified before this collection. The grid below is a post-hoc sensitivity view showing whether the absolute observed paired mean effect reaches each threshold; it is not a confirmatory decision rule.

| Model | >=1% | >=2% | >=3% | >=5% |
|---|---:|---:|---:|---:|
| JWT | Yes | Yes | Yes | Yes |
| OAUTH | Yes | Yes | No | No |
| SESSIONS | Yes | Yes | Yes | No |

## Interpretation Notes

| Model | Interpretation |
|---|---|
| JWT | Mean latency decreased for the tested invalid-credential workload, consistent with faster rejection; this is not evidence of improved normal-workload capacity. |
| OAUTH | Mean latency increased for the tested invalid-credential workload; this measures rejection-path cost, not successful authenticated throughput. |
| SESSIONS | Mean latency decreased for the tested invalid-credential workload, consistent with faster rejection; this is not evidence of improved normal-workload capacity. |

## Raw Inputs

- Primary analysis inputs: docs/performance-results/runs/<runId>/<baseline|attacks>/<model>.json
- Top-level baseline/attack JSON and raw traces are retained for convenience and audit, not used for the paired estimates.
- Baseline raw traces: docs/performance-results/baseline/raw/*.json
- Attack raw traces: docs/performance-results/attacks/raw/*.json
- Per-run summaries: docs/performance-results/runs/<runId>/<baseline|attacks>/<model>.json
- Matched-block protocol metadata: docs/performance-results/runs/<runId>/metadata.json

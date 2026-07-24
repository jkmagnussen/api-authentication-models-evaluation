# Performance Analysis

Generated: 2026-07-24T23:11:17.749Z
Regenerate: npm run perf:analyze

## Method

- Delta percentages compare attacks vs baseline: ((attack - baseline) / baseline) * 100.
- Positive latency deltas indicate slower response under attack.
- Negative throughput delta indicates throughput degradation under attack.
- Effect size is Cohen's d over repeated-run avg latency samples (if run samples exist).
- CI shown is 95% interval for avg latency delta percentage (if repeated-run samples exist).
- Outlier screening uses a Tukey 1.5 x IQR rule over repeated-run average latency samples when at least 4 cohorts exist.

## Comparative Summary

| Model | Baseline Avg (ms) | Attack Avg (ms) | Avg Delta % | p95 Delta % | p99 Delta % | Throughput Delta % | Effect Size (d) | Welch p-value | 95% CI Avg Delta % |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| JWT | 1.5689 | 1.4447 | -7.92 | -7.88 | 12.42 | 8.60 | -0.02 | 0.9782 | [-68.27, 66.62] |
| OAUTH | 1.5974 | 1.5315 | -4.12 | 2.11 | 5.12 | 4.30 | -0.37 | 0.5741 | [-73.68, 43.84] |
| SESSIONS | 1.9459 | 1.3055 | -32.91 | -33.29 | -44.39 | 49.06 | -0.10 | 0.8748 | [-62.55, 54.39] |

## Exploratory Outlier Screening (Repeated-Run Avg Latency)

| Model | Baseline Avg Outliers | Attack Avg Outliers | Baseline IQR Bounds | Attack IQR Bounds | Interpretation |
|---|---|---|---|---|---|
| JWT | None | None | [-2.0475, 7.6025] | [-2.2685, 7.3997] | No repeated-run avg-latency outliers flagged under the IQR rule. |
| OAUTH | None | None | [0.8489, 6.0135] | [-2.3855, 7.3682] | No repeated-run avg-latency outliers flagged under the IQR rule. |
| SESSIONS | None | run-01=1.2234, run-05=4.0013 | [-2.4007, 8.5937] | [3.1593, 3.9593] | Inspect flagged runs before making strong performance claims. |

## Raw Inputs

- Baseline files: docs/performance-results/baseline/*.json
- Attack files: docs/performance-results/attacks/*.json
- Optional repeated samples: docs/performance-results/runs/<runId>/<baseline|attacks>/<model>.json

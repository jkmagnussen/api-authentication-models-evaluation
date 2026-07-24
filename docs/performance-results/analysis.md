# Performance Analysis

Generated: 2026-07-24T11:49:20.421Z
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
| JWT | 1.6471 | 1.6101 | -2.25 | -5.03 | 12.72 | 2.30 | -0.02 | 0.9782 | [-68.27, 66.62] |
| OAUTH | 1.4237 | 1.8829 | 32.26 | 33.78 | 51.01 | -24.39 | -0.37 | 0.5741 | [-73.68, 43.84] |
| SESSIONS | 1.9601 | 1.3814 | -29.52 | -31.03 | -42.63 | 41.89 | -0.10 | 0.8748 | [-62.55, 54.39] |

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

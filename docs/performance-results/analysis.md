# Performance Analysis

Generated: 2026-07-21T18:00:27.187Z
Regenerate: npm run perf:analyze

## Method

- Delta percentages compare attacks vs baseline: ((attack - baseline) / baseline) * 100.
- Positive latency deltas indicate slower response under attack.
- Negative throughput delta indicates throughput degradation under attack.
- Effect size is Cohen's d over repeated-run avg latency samples (if run samples exist).
- CI shown is 95% interval for avg latency delta percentage (if repeated-run samples exist).

## Comparative Summary

| Model | Baseline Avg (ms) | Attack Avg (ms) | Avg Delta % | p95 Delta % | p99 Delta % | Throughput Delta % | Effect Size (d) | 95% CI Avg Delta % |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| JWT | 1.2628 | 1.1731 | -7.11 | -9.29 | -0.58 | 7.65 | n/a | n/a |
| OAUTH | 1.1446 | 1.1956 | 4.46 | 13.09 | 43.82 | -4.27 | n/a | n/a |
| SESSIONS | 1.6955 | 1.0473 | -38.23 | -40.20 | -47.25 | 61.90 | n/a | n/a |

## Raw Inputs

- Baseline files: docs/performance-results/baseline/*.json
- Attack files: docs/performance-results/attacks/*.json
- Optional repeated samples: docs/performance-results/runs/<runId>/<baseline|attacks>/<model>.json

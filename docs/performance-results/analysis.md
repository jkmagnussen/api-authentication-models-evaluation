# Performance Analysis

Generated: 2026-07-23T04:51:28.725Z
Regenerate: npm run perf:analyze

## Method

- Delta percentages compare attacks vs baseline: ((attack - baseline) / baseline) * 100.
- Positive latency deltas indicate slower response under attack.
- Negative throughput delta indicates throughput degradation under attack.
- Effect size is Cohen's d over repeated-run avg latency samples (if run samples exist).
- CI shown is 95% interval for avg latency delta percentage (if repeated-run samples exist).

## Comparative Summary

| Model | Baseline Avg (ms) | Attack Avg (ms) | Avg Delta % | p95 Delta % | p99 Delta % | Throughput Delta % | Effect Size (d) | Welch p-value | 95% CI Avg Delta % |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| JWT | 1.2566 | 1.1802 | -6.08 | -5.21 | -0.95 | 6.47 | -0.02 | 0.9782 | [-68.27, 66.62] |
| OAUTH | 1.1273 | 1.1757 | 4.29 | 5.95 | 44.39 | -4.11 | -0.37 | 0.5741 | [-73.68, 43.84] |
| SESSIONS | 1.6898 | 1.0380 | -38.57 | -42.53 | -44.72 | 62.79 | -0.10 | 0.8748 | [-62.55, 54.39] |

## Raw Inputs

- Baseline files: docs/performance-results/baseline/*.json
- Attack files: docs/performance-results/attacks/*.json
- Optional repeated samples: docs/performance-results/runs/<runId>/<baseline|attacks>/<model>.json

# Performance Analysis

Generated: 2026-07-23T12:16:48.751Z
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
| JWT | 1.3142 | 1.1969 | -8.92 | -11.14 | 3.73 | 9.80 | -0.02 | 0.9782 | [-68.27, 66.62] |
| OAUTH | 1.1468 | 1.2090 | 5.43 | 8.96 | 96.18 | -5.15 | -0.37 | 0.5741 | [-73.68, 43.84] |
| SESSIONS | 1.7591 | 1.0664 | -39.37 | -42.10 | -39.02 | 64.95 | -0.10 | 0.8748 | [-62.55, 54.39] |

## Raw Inputs

- Baseline files: docs/performance-results/baseline/*.json
- Attack files: docs/performance-results/attacks/*.json
- Optional repeated samples: docs/performance-results/runs/<runId>/<baseline|attacks>/<model>.json

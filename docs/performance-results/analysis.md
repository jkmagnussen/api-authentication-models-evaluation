# Performance Analysis

Generated: 2026-07-23T19:41:22.273Z
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
| JWT | 1.5206 | 1.3046 | -14.20 | -20.79 | -31.91 | 16.56 | -0.02 | 0.9782 | [-68.27, 66.62] |
| OAUTH | 1.3040 | 1.5259 | 17.02 | 37.67 | 110.24 | -14.55 | -0.37 | 0.5741 | [-73.68, 43.84] |
| SESSIONS | 1.9079 | 1.2468 | -34.65 | -37.40 | -45.48 | 53.03 | -0.10 | 0.8748 | [-62.55, 54.39] |

## Raw Inputs

- Baseline files: docs/performance-results/baseline/*.json
- Attack files: docs/performance-results/attacks/*.json
- Optional repeated samples: docs/performance-results/runs/<runId>/<baseline|attacks>/<model>.json

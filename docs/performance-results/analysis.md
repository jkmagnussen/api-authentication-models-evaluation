# Performance Analysis

Generated: 2026-07-20T14:32:38.009Z
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
| JWT | 1.2732 | 1.2007 | -5.69 | -7.04 | -1.73 | 6.03 | n/a | n/a |
| OAUTH | 1.1669 | 1.1892 | 1.91 | 1.69 | 37.54 | -1.88 | n/a | n/a |
| SESSIONS | 1.6889 | 1.0751 | -36.34 | -36.43 | -36.43 | 57.09 | n/a | n/a |

## Raw Inputs

- Baseline files: docs/performance-results/baseline/*.json
- Attack files: docs/performance-results/attacks/*.json
- Optional repeated samples: docs/performance-results/runs/<runId>/<baseline|attacks>/<model>.json

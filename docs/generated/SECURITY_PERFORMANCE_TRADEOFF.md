# Security Performance Tradeoff

Generated: 2026-07-21T18:00:29.454Z
Regenerate: npm run compare:reports

This view compares model-level security risk indicators with measured attack-vs-baseline performance deltas.

| Model | Avg Misconfig Severity | AI Failure Rate | Avg Latency Delta % (Attack vs Baseline) | Throughput Delta % | Tradeoff Reading |
|---|---:|---:|---:|---:|---|
| OAUTH | 3.33 | 40.00% | 4.46% | -4.27% | Moderate security risk with manageable performance characteristics. |
| JWT | 4.33 | 60.00% | -7.11% | 7.65% | High security scrutiny needed even if measured performance overhead is modest. |
| SESSIONS | 4.33 | 60.00% | -38.23% | 61.90% | High security scrutiny needed even if measured performance overhead is modest. |

Note: Negative latency delta percentages indicate attack tests were faster in this run set; interpret with workload context, not as security strength.

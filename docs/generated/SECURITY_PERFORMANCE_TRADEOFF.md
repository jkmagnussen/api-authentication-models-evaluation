# Security Performance Tradeoff

Generated: 2026-07-20T14:32:39.323Z
Regenerate: npm run compare:reports

This view compares model-level security risk indicators with measured attack-vs-baseline performance deltas.

| Model | Avg Misconfig Severity | AI Failure Rate | Avg Latency Delta % (Attack vs Baseline) | Throughput Delta % | Tradeoff Reading |
|---|---:|---:|---:|---:|---|
| OAUTH | 4.00 | 40.00% | 1.91% | -1.88% | Misconfiguration impact is severe; prioritize hardening and control validation. |
| JWT | 4.00 | 60.00% | -5.69% | 6.03% | High security scrutiny needed even if measured performance overhead is modest. |
| SESSIONS | 3.67 | 60.00% | -36.34% | 57.09% | AI artifacts frequently miss controls; generated code needs stronger verification. |

Note: Negative latency delta percentages indicate attack tests were faster in this run set; interpret with workload context, not as security strength.

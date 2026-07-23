# Security Performance Tradeoff

Generated: 2026-07-23T03:48:51.155Z
Regenerate: npm run compare:reports

This view compares model-level security risk indicators with measured attack-vs-baseline performance deltas.

| Model | Avg Misconfig Severity | AI Failure Rate | Avg Latency Delta % (Attack vs Baseline) | Throughput Delta % | Tradeoff Reading |
|---|---:|---:|---:|---:|---|
| OAUTH | 4.00 | 90.00% | -7.65% | 8.28% | High security scrutiny needed even if measured performance overhead is modest. |
| JWT | 4.33 | 10.00% | -5.69% | 6.04% | Misconfiguration impact is severe; prioritize hardening and control validation. |
| SESSIONS | 4.33 | 20.00% | -32.98% | 49.21% | Misconfiguration impact is severe; prioritize hardening and control validation. |

Note: Negative latency delta percentages indicate attack tests were faster in this run set; interpret with workload context, not as security strength.

## Exploratory Misconfiguration Severity Pairwise Contrasts (Holm Corrected)

| Model A | Model B | Raw exploratory p-value | Holm-adjusted p | Flag @ 0.05 | Note |
|---|---|---:|---:|---|
| OAUTH | JWT | 0.5403 | 1.0000 | No | Exploratory contrast on ordinal judgement scores |
| OAUTH | SESSIONS | 0.5403 | 1.0000 | No | Exploratory contrast on ordinal judgement scores |
| JWT | SESSIONS | 1.0000 | 1.0000 | No | Exploratory contrast on ordinal judgement scores |

Interpretation guardrail: these contrasts are exploratory only because severity values are researcher-assigned ordinal scores, not direct sampled measurements.
See docs/generated/SENSITIVITY_ANALYSIS.md for weighting sensitivity and ranking stability outputs.

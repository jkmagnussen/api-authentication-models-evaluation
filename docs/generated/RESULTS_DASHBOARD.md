# Dissertation Results Dashboard

Generated: 2026-07-21T18:00:38.554Z
Regenerate: npm run results:index

## Quick Commands

- Full startup run: `npm run startup`
- Rerun OAuth module: `npm run rerun:oauth`
- Rerun JWT module: `npm run rerun:jwt`
- Rerun Sessions module: `npm run rerun:sessions`
- Rerun AI evaluation: `npm run rerun:ai`
- Rerun performance: `npm run rerun:perf`

## Snapshot

- Focused variant proofs passing: 9/9
- Total focused-variant runtime: 13244 ms

## Performance Delta Summary

| Model | Avg Delta % | p95 Delta % | Throughput Delta % |
|---|---:|---:|---:|
| JWT | -7.11% | -9.29% | 7.65% |
| OAUTH | 4.46% | 13.09% | -4.27% |
| SESSIONS | -38.23% | -40.20% | 61.90% |

## AI Failure Rates

| Model | Total Samples | Failed | Failure Rate |
|---|---:|---:|---:|
| OAUTH | 30 | 12 | 40.0% |
| JWT | 30 | 18 | 60.0% |
| SESSIONS | 30 | 18 | 60.0% |
| OVERALL | 90 | 48 | 53.3% |

## Primary Artifacts

- docs/generated/VARIANT_FOCUSED_SUMMARY.md
- docs/generated/VARIANT_DIFFERENTIAL_REPORT.md
- docs/generated/AI_EVALUATION_SUMMARY.md
- docs/generated/ADVANCED_SECURITY_RESEARCH_ANALYSIS.md
- docs/generated/THREE_ARM_AI_COMPARISON.md
- docs/generated/SECURITY_PERFORMANCE_TRADEOFF.md
- docs/performance-results/analysis.md
- docs/generated/CODE_FOOTPRINT_SUMMARY.md

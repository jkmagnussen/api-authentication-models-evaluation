# Dissertation Results Dashboard

Generated: 2026-07-23T11:51:21.740Z
Regenerate: npm run results:index

## Quick Commands

- Full offline end-to-end run (DB to frozen results): `npm run run:all:offline`
- Full startup run: `npm run startup`
- Rerun OAuth module: `npm run rerun:oauth`
- Rerun JWT module: `npm run rerun:jwt`
- Rerun Sessions module: `npm run rerun:sessions`
- Rerun AI evaluation (offline artifacts): `npm run rerun:ai`
- Rerun AI generation + evaluation (live providers): `npm run rerun:ai:live`
- Rerun performance: `npm run rerun:perf`

## Snapshot

- Focused variant proofs passing: 9/9
- Total focused-variant runtime: 13448 ms

## Performance Delta Summary

| Model | Avg Delta % | p95 Delta % | Throughput Delta % |
|---|---:|---:|---:|
| JWT | -7.84% | -9.54% | 8.50% |
| OAUTH | 4.72% | 15.28% | -4.50% |
| SESSIONS | -37.52% | -40.32% | 60.06% |

## AI Failure Rates

| Model | Total Samples | Failed | Failure Rate |
|---|---:|---:|---:|
| OAUTH | 30 | 27 | 90.0% |
| JWT | 30 | 3 | 10.0% |
| SESSIONS | 30 | 4 | 13.3% |
| OVERALL | 90 | 34 | 37.8% |

## Primary Artifacts

- docs/generated/VARIANT_DIFFERENTIAL_REPORT.md
- docs/generated/AI_EVALUATION_SUMMARY.md
- docs/generated/ADVANCED_SECURITY_RESEARCH_ANALYSIS.md
- docs/generated/AI_PROVIDER_PROMPT_COMPARISON.md
- docs/generated/OBJECTIVITY_ASSESSMENT.md
- docs/generated/PREREGISTERED_COMPLIANCE.md
- docs/generated/RUN_MANIFEST.json
- docs/generated/SECURITY_PERFORMANCE_TRADEOFF.md
- docs/performance-results/analysis.md
- docs/generated/CODE_FOOTPRINT_SUMMARY.md

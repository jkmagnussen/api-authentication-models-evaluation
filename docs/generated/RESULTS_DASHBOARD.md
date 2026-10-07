# Dissertation Results Dashboard

Snapshot updated: 2026-10-07
This dashboard is a curated summary; no single dashboard-generation command is maintained. Regenerate the domain reports with the commands below.

## Quick Commands

- Refresh clean AI comparison reports: `npm run compare:ai:providers -- --study-id ai-clean-2026-10-05`
- Preview a future AI generation plan without provider calls: `npm run ai:matrix:cohorts -- --plan`
- Refresh performance statistics from retained v7 runs: `npm run perf:analyze`
- Refresh charts: `analysis-python/.venv/Scripts/python.exe analysis-python/generate_charts.py`
- Check generated-document presence: `npm run docs:check`

Database-backed test and variant commands reset authentication tables; use a disposable database configured through `.env`.

## Snapshot

- Mapped focused misconfiguration proofs: 9; execution not repeated in this database-safe audit.
- Clean AI cohort: 30 matched blocks; 90 outputs per arm; 360 total.
- AI paired inference: suppressed because OpenAI system fingerprints differ between prompt conditions.

## Performance Delta Summary

| Model | Mean Paired Average-Latency Delta % | Verified Pairs |
|---|---:|---:|---:|
| JWT | -26.53% | 30 |
| OAUTH | 2.10% | 30 |
| SESSIONS | -4.93% | 30 |

These are protocol-v7 invalid-credential rejection-path measurements, not successful authenticated throughput or production capacity.

## AI Failure Rates

| Provider | Prompt condition | Total samples | Heuristic failures | Failure rate |
|---|---|---:|---:|---:|
| OpenAI | neutral | 90 | 90 | 100.0% |
| OpenAI | security-guided | 90 | 86 | 95.6% |
| Claude | neutral | 90 | 81 | 90.0% |
| Claude | security-guided | 90 | 85 | 94.4% |
| All arms | pooled descriptive total | 360 | 342 | 95.0% |

Failures mean at least one static heuristic check failed. Do not interpret these as runtime vulnerability rates or human ratings.

## Primary Artifacts

- docs/generated/VARIANT_DIFFERENTIAL_REPORT.md
- docs/generated/AI_EVALUATION_SUMMARY.md
- docs/generated/ADVANCED_SECURITY_RESEARCH_ANALYSIS.md
- docs/generated/FAILURE_PROPAGATION_ANALYSIS.md
- docs/generated/COGNITIVE_LOAD_INDEX.md
- docs/generated/CROSS_REFERENCE_SYNTHESIS.md
- docs/generated/AI_PROVIDER_PROMPT_COMPARISON.md
- docs/generated/AI_PROVIDER_PROMPT_COMPARISON_BLINDED.md
- ai-generated/cohorts/ai-clean-2026-10-05/study-manifest.json
- docs/generated/OBJECTIVITY_ASSESSMENT.md
- docs/generated/PREREGISTERED_COMPLIANCE.md
- docs/generated/RUN_MANIFEST.json
- docs/generated/SECURITY_PERFORMANCE_TRADEOFF.md
- docs/performance-results/analysis.md
- docs/generated/CODE_FOOTPRINT_SUMMARY.md

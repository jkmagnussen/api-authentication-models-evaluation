# Validity Framing Checklist (Dissertation)

Date: 2026-07-23
Scope: AI vs Human advanced safety comparison pipeline

## Required Framing Statements

- [x] Repository-scoped inference only (not universal across all teams/models)
- [x] Green metric is a compute proxy, not direct energy measurement
- [x] False-confidence results depend on threshold choice; sensitivity reported
- [x] Baseline risk computed with one-baseline-per-model assumption
- [x] Focal controls are a sentinel subset; full-control sensitivity included
- [x] Bootstrap CI is seeded and reproducible (seed + iterations recorded)

## Source Evidence Locations

- Advanced report: docs/generated/AI_VS_HUMAN_ADVANCED_COMPARISONS.md
- Advanced JSON metadata: docs/generated/ai-vs-human-advanced-comparisons.json
- Repro/build/pipeline log: docs/evidence/dissertation-readiness/readiness-log-20260723-161548.txt

## Examiner-facing Notes

- Build gate failure in npm run prod is due to runtime port occupancy (3000 in use), not a compile/typecheck failure.
- Build compilation and generated-artifact checks pass before runtime server bind step.
- For appendix reproducibility, include either:
  1. command to free port 3000 before npm run prod, or
  2. command to override PORT (for example PORT=3001) during runtime checks.

## Exact Hash Reproducibility Mode

- To produce raw-hash-stable advanced comparison artifacts across reruns:
  1. set REPRO_MODE=1
  2. set REPRO_TIMESTAMP=2000-01-01T00:00:00.000Z (or any fixed ISO timestamp)
  3. run npm run decision:ai-vs-human:advanced
- Verified result: reproducibility-mode raw hashes match across consecutive runs.

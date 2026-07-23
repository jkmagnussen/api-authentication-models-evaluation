# Research Question Traceability

This document links likely dissertation research questions to concrete repository evidence.

- Pre-registered analysis plan: `docs/evidence/PRE_REGISTERED_ANALYSIS_PLAN.md`

## RQ1. How do secure baseline implementations of Sessions, JWT, and OAuth2 behave under functional and attack-oriented evaluation?

- Evidence: `docs/evidence/TEST_EVIDENCE_MATRIX.md`
- Supporting artifacts:
  - baseline unit and integration tests
  - attack tests in `tests/attacks/`
  - coverage evidence in `docs/COVERAGE_SNAPSHOT.md`

## RQ2. How do targeted misconfigurations alter the security behavior of otherwise working authentication models?

- Evidence: `docs/evidence/DISSERTATION_EVALUATION_TABLE.md`
- Supporting artifacts:
  - `docs/generated/VARIANT_DIFFERENTIAL_REPORT.md`
  - `docs/generated/VARIANT_DIFFERENTIAL_REPORT.md` (Execution Outcomes section)
  - focused variant exploit commands in `package.json`

## RQ3. How does the complexity and code footprint of the baseline compare with misconfigured and AI-generated alternatives?

- Evidence: `docs/generated/CODE_FOOTPRINT_SUMMARY.md`
- Supporting artifacts:
  - `docs/evidence/UNIFIED_COMPARISON_MATRIX.md`
  - `ai-generated/results/ai-samples-summary.csv`

## RQ4. To what extent do AI-generated authentication artifacts omit or weaken expected security controls?

- Evidence: `docs/generated/AI_EVALUATION_SUMMARY.md`
- Supporting artifacts:
  - `ai-generated/results/ai-samples-failure-rates.csv`
  - `ai-generated/results/*.json`
  - `ai-generated/validate-controls.ts` outputs for heuristic validation

## RQ5. How do the authentication models compare in runtime overhead under baseline and attack conditions?

- Evidence: `docs/performance-results/analysis.md`
- Supporting artifacts:
  - `docs/performance-results/statistical-summary.csv`
  - repeated-run performance outputs in `docs/performance-results/runs/`

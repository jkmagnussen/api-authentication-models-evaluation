# Distinction Upgrade Checklist (One-Day Pass)

Use this as an assessor-facing execution log for the final quality uplift.

## Block 1 (90 min): Originality And Contribution Framing

- [x] Add explicit originality statement (methodological contribution, not algorithmic novelty).
- [x] State what is genuinely new relative to common baseline-vs-model comparisons.
- [x] Distinguish behavioral evidence claims from artifact-structural evidence claims.

Primary location:

- `docs/METHODOLOGY_AND_LIMITATIONS.md`

## Block 2 (75 min): Alternatives And Tradeoff Evidence

- [x] Add explicit alternatives table for major design decisions.
- [x] Record why alternatives were not chosen.
- [x] Record tradeoff accepted for each decision.

Primary location:

- `docs/evidence/DISSERTATION_EVALUATION_TABLE.md`

## Block 3 (60 min): Negative Findings And Failure Modes

- [x] Add section for observed weaknesses and non-ideal outcomes.
- [x] Tie each weakness to claim-strength limitations.
- [x] Prevent over-claiming by narrowing conclusion scope.

Primary location:

- `docs/evidence/THREATS_TO_VALIDITY.md`

## Block 4 (60 min): Transferability/Generalisability Boundaries

- [x] Separate likely portable findings from context-specific findings.
- [x] State conditional portability requirements.
- [x] List non-transferable result classes (for example absolute latency values).

Primary location:

- `docs/METHODOLOGY_AND_LIMITATIONS.md`

## Block 5 (30 min): Consistency And Compliance Sweep

- [ ] Confirm wording consistency between Key Findings, Methodology, Threats, and README.
- [ ] Confirm no section overstates universality.
- [ ] Confirm submission appendices checklist is complete in dissertation package.

Suggested references for this final sweep:

- `docs/KEY_FINDINGS.md`
- `docs/REPRODUCIBILITY_CHECKLIST.md`
- `docs/evidence/RESEARCH_QUESTION_TRACEABILITY.md`

## Validation

- [ ] Run: `npm run docs:check`
- [ ] If generated outputs changed by design, refresh freeze lock and verify.
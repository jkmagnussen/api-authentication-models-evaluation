# Contributing

## Goal

Keep pull requests aligned with the same checks enforced in CI.

## Local Preflight

Run this before opening or updating a pull request:

```powershell
npm run ci:local
```

This command runs:

1. docs generation and artifact presence checks
2. generated artifact drift check
3. markdown docs lint
4. full Jest test suite

## Reusable CLI Command Groups

- `npm run docs:generate:*` commands let you regenerate specific evidence slices.
- `npm run docs:verify` runs default drift + lint.
- `npm run docs:verify:strict` runs strict drift + lint.
- `npm run ci:docs` and `npm run ci:tests` mirror CI jobs exactly.
- `npm run ci:local:strict` runs strict docs checks plus tests.
- `npm run objective:preregistered:check` enforces confirmatory guardrails (single primary endpoint policy, leakage checks, manifest normalization, and repeated-run power thresholds).
- `npm run ai:matrix:cohorts` runs repeated AI matrix cohorts with timeout safeguards and then executes prereg manifest/report/check in one flow.
- `npm run objective:blind:finalize -- --primary "..." --decision "..." --caveats "..."` finalizes blind interpretation with required rationale fields and updates blinded-report SHA256.
- `npm run objective:blind:finalize -- --primary "..." --decision "..." --caveats "..." --reviewer-a "..." --reviewer-b "..." --reviewer-agreement "AGREE|DISAGREE" [--tie-break-reviewer "..." --tie-break-decision "..."]` finalizes blind interpretation with required dual-reviewer sign-off and tie-break escalation when needed.
- `npm run objective:window:lock` preserves/creates a frozen analysis window lock; `npm run objective:window:refresh` intentionally refreshes it after accepted protocol updates.
- `npm run objective:holdout:seal` hash-locks the holdout definition; `npm run objective:holdout:refresh` intentionally reseals after approved holdout changes.
- `npm run objective:sentinel` generates sentinel control checks that must pass before confirmatory interpretation.
- `npm run objective:confirmatory` runs compare reports, manifest generation, prereg report generation, and strict prereg compliance checks in one command.
- Before confirmatory prereg checks, finalize blind interpretation by updating `docs/generated/AI_BLIND_INTERPRETATION.md` status to `FINALIZED_PRE_UNBLIND` and keeping its blinded-report SHA256 aligned with the current blinded report.

## Branch Protection

In repository settings, require the `quality-gate` status check from the CI workflow.

## Notes

- Generated evidence under `docs/generated/` and `docs/performance-results/` is expected to be committed for reproducible snapshots.
- If you touch report logic, tests, or docs scripts, rerun `npm run ci:local` before commit.
- CI fails if `npm run docs:generate` produces tracked generated-artifact drift.
- `npm run docs:drift` checks tracked generated-artifact drift.
- `npm run docs:drift:strict` also fails for untracked generated artifacts.
- Confirmatory AI claims require repeated AI matrix cohorts per arm (default threshold: 3). Until met, preregistered checks intentionally block confirmatory interpretation.

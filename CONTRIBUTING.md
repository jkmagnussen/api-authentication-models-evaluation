# Contributing

Use this before opening or updating a pull request.

## Local Preflight

```powershell
npm run ci:local
```

Includes:

1. docs generation and artifact checks
2. generated artifact drift checks
3. markdown lint
4. full Jest tests

## Common Commands

- `npm run docs:generate:*` regenerates specific evidence slices.
- `npm run docs:verify` runs default drift + lint checks.
- `npm run docs:verify:strict` also fails on untracked generated artifacts.
- `npm run py:charts:validate` checks chart metric-to-SVG consistency.
- `npm run ci:docs` and `npm run ci:tests` mirror CI jobs.
- `npm run ci:local:strict` runs strict docs checks plus tests.
- `npm run objective:preregistered:check` runs confirmatory guardrails.
- `npm run ai:matrix:cohorts` runs repeated AI cohorts and prereg checks.
- `npm run objective:blind:finalize -- --primary "..." --decision "..." --caveats "..." --reviewer-a "..." --reviewer-b "..." --reviewer-agreement "AGREE|DISAGREE" [--tie-break-reviewer "..." --tie-break-decision "..."]` finalizes blind interpretation with reviewer sign-off.
- `npm run objective:window:lock` and `npm run objective:window:refresh` manage the analysis window lock.
- `npm run objective:holdout:seal` and `npm run objective:holdout:refresh` manage holdout sealing.
- `npm run objective:sentinel` runs sentinel controls.
- `npm run objective:confirmatory` runs the confirmatory chain in one command.

## Branch Protection

In repository settings, require the `quality-gate` status check from the CI workflow.

## Notes

- Generated evidence under `docs/generated/` and `docs/performance-results/` is expected to be committed for reproducible snapshots.
- If you touch report logic, tests, or docs scripts, rerun `npm run ci:local` before commit.
- CI fails if `npm run docs:generate` produces tracked generated-artifact drift.
- `npm run docs:drift` checks tracked generated-artifact drift.
- `npm run docs:drift:strict` also fails for untracked generated artifacts.
- Confirmatory AI claims require repeated AI matrix cohorts per arm (default threshold: 3). Until met, preregistered checks intentionally block confirmatory interpretation.

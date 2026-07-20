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

## Branch Protection

In repository settings, require the `quality-gate` status check from the CI workflow.

## Notes

- Generated evidence under `docs/generated/` and `docs/performance-results/` is expected to be committed for reproducible snapshots.
- If you touch report logic, tests, or docs scripts, rerun `npm run ci:local` before commit.
- CI fails if `npm run docs:generate` produces tracked generated-artifact drift.
- `npm run docs:drift` checks tracked generated-artifact drift.
- `npm run docs:drift:strict` also fails for untracked generated artifacts.

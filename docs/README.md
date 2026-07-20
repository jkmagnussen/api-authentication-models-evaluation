# Docs Index

This folder is organized to separate narrative docs from generated evidence.

## Root (human-authored guides)

- REPO_QUICK_GUIDE.md
- REPO_QUICK_GUIDE.pdf
- METHODOLOGY_AND_LIMITATIONS.md
- REPRODUCIBILITY_CHECKLIST.md
- KEY_FINDINGS.md
- COVERAGE_SNAPSHOT.md
- performance-results/
- charts/

## Evidence (human-authored matrices and traceability)

- evidence/TEST_EVIDENCE_MATRIX.md
- evidence/DISSERTATION_EVALUATION_TABLE.md
- evidence/RESEARCH_QUESTION_TRACEABILITY.md
- evidence/THREATS_TO_VALIDITY.md
- evidence/UNIFIED_COMPARISON_MATRIX.md

## Generated (script outputs)

- generated/AI_EVALUATION_SUMMARY.md
- generated/CODE_FOOTPRINT_SUMMARY.md
- generated/VARIANT_DIFFERENTIAL_REPORT.md
- generated/VARIANT_FOCUSED_SUMMARY.md
- generated/MISCONFIGURATION_IMPACT_MATRIX.md
- generated/MODEL_RISK_SUMMARY.md
- generated/AI_FAILURE_TAXONOMY.md
- generated/SECURITY_PERFORMANCE_TRADEOFF.md
- generated/code-footprint-summary.json
- generated/variant-focused-summary.json

## How to Regenerate Generated Docs

- npm run docs:generate
- npm run docs:generate:variants
- npm run docs:generate:code
- npm run docs:generate:performance
- npm run docs:generate:ai
- npm run docs:generate:package
- npm run docs:check
- npm run docs:drift
- npm run docs:drift:strict
- npm run docs:lint
- npm run docs:verify
- npm run docs:verify:strict

## Command Matrix

| Command | Purpose | Fails On Untracked Generated Artifacts | Typical Use |
|---|---|---|---|
| `npm run docs:generate` | Regenerate all generated documentation artifacts | No | Refresh evidence outputs after code/report changes |
| `npm run docs:verify` | Validate generated artifacts with default drift + lint | No | Fast local verification during development |
| `npm run docs:verify:strict` | Validate generated artifacts with strict drift + lint | Yes | Pre-release or strict repository hygiene checks |
| `npm run ci:docs` | CI-equivalent docs pipeline (`generate + verify`) | No | Match CI docs job locally |
| `npm run ci:docs:strict` | Strict CI-equivalent docs pipeline | Yes | Enforce tracked + untracked cleanliness locally |
| `npm run ci:tests` | Run full automated test suite | n/a | Isolated test validation |
| `npm run ci:local` | Full local quality gate (`ci:docs + ci:tests`) | No | Pre-push / pre-PR default flow |
| `npm run ci:local:strict` | Full local quality gate with strict docs checks | Yes | Final validation when requiring strict artifact policy |

## Generated Artifact Policy

- Commit files under `docs/generated/` and `docs/performance-results/` when they are part of submitted evidence snapshots.
- If a change affects logic, tests, or report scripts, rerun `npm run docs:generate` before commit.
- Use `npm run docs:check` in CI or pre-merge verification to confirm expected generated artifacts exist.

## CI Workflow

- GitHub Actions workflow: `.github/workflows/ci.yml`
- `docs` job runs `npm run ci:docs` (generate, drift check, lint).
- Drift checking in CI fails on tracked generated-artifact changes.
- Use `npm run docs:drift:strict` locally when you also want untracked artifact failures.
- CI uses concurrency cancellation to avoid duplicate runs on rapid pushes.
- `docs` job uploads generated artifact snapshots for diagnostics.
- `tests` job runs `npm run ci:tests`.
- `quality-gate` job aggregates both jobs into one required status.

## Branch Protection Recommendation

- In repository branch protection rules, require the `quality-gate` status check.
- This keeps docs and tests parallel for speed while preserving a single merge gate.

## Contributor Workflow

- See `CONTRIBUTING.md` for local preflight and pull request expectations.
- Use `npm run ci:local` before opening or updating a pull request.
- Use `npm run ci:local:strict` when you want drift checks to fail on untracked generated artifacts too.

## Individual Regeneration Commands

- npm run ai:report
- npm run compare:reports
- npm run code:footprint
- npm run variants:report
- npm run test:variants:focused
- npm run perf:analyze
- npm run docs:pdf

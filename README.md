# API Authentication Models Evaluation

**Production commands:** `npm run prod` (clean build + start), `npm run prod:full` (full pipeline + start)

**Build commands:** `npm run build` (auto-cleans tracked generated outputs, then compiles), `npm run build:full` (auto-cleans generated outputs first, then runs db setup + tests + docs/report generation + compile)

**Clean regeneration:** `npm run regen:clean` (alias of `npm run build:full`), `npm run clean:generated` (tracked generated files only), `npm run clean:generated:all` (tracked + untracked generated files)

**Run everything (start to finish):** `npm run run:all:offline`

This repository is a dissertation-focused evaluation of three API authentication models in one controlled backend:

- Sessions
- JWT
- OAuth 2.0 (Authorization Code + PKCE)

The project compares them across security behavior, controlled misconfiguration impact, performance overhead, and code/maintainability characteristics.
Its primary contribution is methodological: a controlled, reproducible protocol that separates behavioral evidence from artifact-level evidence.

## What This Project Includes

1. **Secure baseline implementations** in `src/`.
2. **Targeted misconfiguration variants** in `misconfigurations/`.
3. **AI-generated artifact evaluation** in `ai-generated/`.
4. **Automated evidence generation** in `scripts/`.
5. **Dissertation-ready outputs** in `docs/`.

## One-Command Full Pipeline

```powershell
npm run run:all:offline
```

This command runs the full reproducible path:

1. Database generate + migrate + seed
2. Tests and focused variant checks
3. Report and dashboard generation
4. Python chart generation
5. Offline freeze lock refresh and verification

## Quick Start

### Prerequisites

- Node.js + npm
- PostgreSQL
- Optional: Python/uv (for chart generation)

### Setup

```powershell
git clone https://github.com/jkmagnussen/api-authentication-models-evaluation.git
cd api-authentication-models-evaluation
npm install
npx prisma migrate dev
npx prisma generate
npx ts-node prisma/seed.ts
```

### Full Reproducible Run

```powershell
npm run run:all:offline
```

## Most-Used Commands

| Purpose | Command |
|---|---|
| Full reproducible offline run | `npm run run:all:offline` |
| Fast local startup path | `npm run startup:fast` |
| Full startup alias | `npm run startup` |
| Rerun OAuth evidence | `npm run rerun:oauth` |
| Rerun JWT evidence | `npm run rerun:jwt` |
| Rerun Sessions evidence | `npm run rerun:sessions` |
| Rerun AI reports from existing artifacts | `npm run rerun:ai` |
| Live AI regeneration path | `npm run rerun:ai:live` |
| Rerun performance evidence | `npm run rerun:perf` |
| Refresh dashboard only | `npm run results:index` |
| Validate generated docs/artifacts | `npm run docs:check` |

Primary results page: `docs/generated/RESULTS_DASHBOARD.md`

## Evaluation Design

### 1) Secure Baseline

- Implementations in `src/`
- Verified with unit, integration, attack, and performance tests

### 2) Misconfiguration Variants

- Controlled overrides in `misconfigurations/`
- Verified with exploit-positive focused tests

### 3) AI-Generated Artifacts

- Prompt-derived artifacts in `ai-generated/`
- Evaluated for complexity, omissions, and insecure patterns
- Treated as artifact evidence (not runtime-swapped parity claims by default)
- Interpreted as variable-quality, review-required drafts rather than deployment-ready substitutions

## Interpretation Guardrails

- Lower measured attack overhead does not automatically imply stronger security posture.
- Configuration discipline is a dominant factor across Sessions, JWT, and OAuth.
- AI artifact maintainability signals do not guarantee security completeness.

## Repository Map

```text
src/                Secure baseline implementations
tests/              Unit/integration/attack/performance tests
misconfigurations/  Targeted insecure overrides
ai-generated/       AI samples and AI analysis outputs
scripts/            Evidence/report generation
prisma/             Schema, migrations, and seed
docs/               Dissertation-facing narrative and evidence
```

## Key Evidence Files

### Core Narrative

- `docs/METHODOLOGY_AND_LIMITATIONS.md`
- `docs/KEY_FINDINGS.md`
- `docs/REPRODUCIBILITY_CHECKLIST.md`

### Evidence and Traceability

- `docs/evidence/TEST_EVIDENCE_MATRIX.md`
- `docs/evidence/DISSERTATION_EVALUATION_TABLE.md`
- `docs/evidence/RESEARCH_QUESTION_TRACEABILITY.md`
- `docs/evidence/THREATS_TO_VALIDITY.md`
- `docs/evidence/UNIFIED_COMPARISON_MATRIX.md`

### Generated Outputs

- `docs/generated/RESULTS_DASHBOARD.md`
- `docs/generated/VARIANT_DIFFERENTIAL_REPORT.md`
- `docs/generated/AI_EVALUATION_SUMMARY.md`
- `docs/generated/CODE_FOOTPRINT_SUMMARY.md`
- `docs/generated/SECURITY_PERFORMANCE_TRADEOFF.md`
- `docs/generated/MISCONFIGURATION_IMPACT_MATRIX.md`
- `docs/generated/AI_FAILURE_TAXONOMY.md`
- `docs/generated/RUN_MANIFEST.json`

### Performance and Charts

- `docs/performance-results/analysis.md`
- `docs/charts/`
- `docs/generated/ML_LITE_ANALYSIS_SUMMARY.md`

## Offline Freeze Mode

Freeze mode protects generated evidence integrity for submission.

```powershell
npm run freeze:offline
npm run freeze:verify
```

- Lock file: `docs/generated/OFFLINE_FREEZE_LOCK.json`
- While lock exists, live provider generation is blocked by default.
- To intentionally allow live regeneration:

```powershell
$env:ALLOW_LIVE_AI_GENERATION="true"
```

## AI Evaluation Commands

### Offline (report refresh from existing artifacts)

```powershell
npm run rerun:ai
```

### Live provider generation (intentional)

```powershell
npm run rerun:ai:live
```

### Cohort/confirmatory workflow

```powershell
npm run ai:matrix:cohorts
npm run objective:confirmatory
```

## API Routes

For detailed routes and request/response examples:

- `routes.md`
- `docs/Routes.postman_collection.json`

## Notes For Submission Readiness

Before submission, ensure:

1. `npm run run:all:offline` completes successfully.
2. `npm run docs:check` passes.
3. `npm run freeze:verify` passes.
4. Required dissertation appendices are present (proposal, ethics, specification/design).
5. IT artifact access path and video demo path are confirmed.

## License

MIT

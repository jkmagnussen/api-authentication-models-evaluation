# API Authentication Models Evaluation

**Recommended commands:** `npm run prod` for normal startup, `npm run run:all:offline` for the full reproducible dissertation run, and `npm run prod:full` for a one-step full pipeline start.

**Execution mode:** local Node.js/npm is the primary workflow; Docker is optional and intended for cross-machine reproducibility checks.

**What the full offline run does:** `npm run run:all:offline` runs database generation, migration, and seeding; then tests, coverage, performance, docs/report generation, mutation testing, results indexing, Python chart generation, and offline freeze verification.

**Supporting commands:** `npm run docs:check` for generated-artifact validation.

**Install/setup first:** install Node.js + npm, install Python 3 (for example `winget install Python.Python.3.12`) and uv if you want chart generation, then run `npm install` in the repo before using the commands below.

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

This command is the full reproducible path:

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
- Optional: Docker Desktop (only if you want containerized execution)

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

### Primary Local Run (No Docker)

```powershell
npm run dev
```

or:

```powershell
npm run prod
```

### Optional Docker Run (Examiner-Friendly)

Use this only if Docker is installed and running.

```powershell
npm run docker:build
docker run --rm -p 3000:3000 dissertation-backend:local
```

## Most-Used Commands

| Purpose | Command |
|---|---|
| Normal startup | `npm run prod` |
| Full reproducible offline run | `npm run run:all:offline` |
| One-step full pipeline start | `npm run prod:full` |
| Optional container image build | `npm run docker:build` |
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
- `docs/generated/FAILURE_PROPAGATION_ANALYSIS.md`
- `docs/generated/COGNITIVE_LOAD_INDEX.md`
- `docs/generated/UNIFIED_ATTACK_SURFACE_COMPRESSION.md`
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

### Postman OAuth PKCE Flow (Automated)

The collection now auto-generates PKCE for OAuth and stores values between requests.

Run requests in this order:

1. `OAuth (authorize)`
2. `OAuth (token)`

What is automated:

- `OAuth (authorize)` pre-request script generates `oauth_code_verifier`, `oauth_code_challenge`, and `oauth_state`.
- `OAuth (authorize)` test script stores `oauth_code` from the response.
- `OAuth (token)` uses `oauth_code`, `oauth_state`, and `oauth_code_verifier` automatically.

### Postman Base URL And Account Security

- Change `base_url` in the collection variables when switching between local dev/prod targets.
- The collection now includes `Password Reset Request`, `Password Reset Confirm`, `MFA Enroll`, and `MFA Verify` requests under `Supplementary Account Security`.
- These routes live under `/auth/security/*` because they harden user-account operations across JWT, Sessions, and OAuth rather than belonging to one auth model.
- Treat this section as supplementary production hardening rather than part of the primary OAuth vs JWT vs Sessions comparative evaluation.

## PKCE Startup Helper

The server does not print a PKCE `code_challenge` and `code_verifier` on startup by default.

- Optional opt-in in any environment:

```powershell
$env:LOG_PKCE_STARTUP="true"
```

## Notes For Submission Readiness

Before submission, ensure:

1. `npm run run:all:offline` completes successfully.
2. `npm run docs:check` passes.
3. `npm run freeze:verify` passes.
4. Required dissertation appendices are present (proposal, ethics, specification/design).
5. IT artifact access path and video demo path are confirmed.

## License

MIT

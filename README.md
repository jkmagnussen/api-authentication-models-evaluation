# API Authentication Models Evaluation

This project evaluates three API authentication models in one controlled backend:

- Sessions
- JWT
- OAuth 2.0 (Authorization Code + PKCE)

You can use it to compare security behavior, misconfiguration impact, performance overhead, and maintainability signals through one reproducible pipeline.

## Quick Start

### First-Time Setup (Recommended)

For the first run, do this in order:

1. Install Node.js (includes npm) and PostgreSQL.
2. Clone this repository and run `npm install`.
3. Configure `.env` with at least a valid `DATABASE_URL` for your local PostgreSQL instance.
4. Run `npm run db:setup` to apply schema and seed data.
5. Install Postman and import `postman.json` from the repository root.
6. (Optional Extra) install Python tooling for chart regeneration via `npm run py:install`.

### Prerequisites

- Node.js + npm
- PostgreSQL
- Postman (for request collection testing)
- Optional: Python + uv (chart regeneration)
- Optional: Docker Desktop (containerized execution)

### Setup

```powershell
git clone https://github.com/jkmagnussen/api-authentication-models-evaluation.git
cd api-authentication-models-evaluation
npm install
npm run db:setup
```

Optional (for chart regeneration):

```powershell
npm run py:install
```

### Main Commands

| Purpose                       | Command                   |
| ----------------------------- | ------------------------- |
| Local development             | `npm run dev`             |
| Normal startup                | `npm run prod`            |
| Full reproducible offline run | `npm run run:all:offline` |
| Full pipeline + start         | `npm run prod:full`       |
| Validate generated artifacts  | `npm run docs:check`      |
| Docker image build (optional) | `npm run docker:build`    |

## One-Command Full Pipeline

```powershell
npm run run:all:offline
```

This run covers database setup, tests, coverage, performance analysis, docs/report generation, mutation testing, results indexing, Python chart generation, and offline freeze verification.

For the full assessor-facing sequence, use `docs/REPRODUCIBILITY_CHECKLIST.md`.

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

## Key Docs

- `docs/REPRODUCIBILITY_CHECKLIST.md` - canonical run sequence and final checklist
- `docs/generated/RESULTS_DASHBOARD.md` - top-level generated results snapshot
- `docs/performance-results/analysis.md` - generated performance summary
- `docs/charts/README.md` - chart catalog (split into `primary/` and `supporting/` tiers)

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

## AI Commands

- Offline report refresh: `npm run rerun:ai`
- Live provider generation: `npm run rerun:ai:live`
- Cohort + confirmatory flow: `npm run ai:matrix:cohorts` then `npm run objective:confirmatory`

## API Routes

For detailed routes and request/response examples, see:

- `routes.md`
- `postman.json`

`routes.md` includes both the primary comparative model routes (Sessions/JWT/OAuth) and supplementary account security routes. The supplementary account security routes are hardening endpoints, not part of the core comparative evaluation

### Postman OAuth PKCE Flow (Automated)

The collection auto-generates PKCE for OAuth and stores values between requests.

Run requests in this order:

1. `OAuth (authorize)`
2. `OAuth (token)`

What is automated:

- `OAuth (authorize)` pre-request script generates `oauth_code_verifier`, `oauth_code_challenge`, and `oauth_state`.
- `OAuth (authorize)` test script stores `oauth_code` from the response.
- `OAuth (token)` uses `oauth_code`, `oauth_state`, and `oauth_code_verifier` automatically.

### Postman Base URL And Account Security

- Change `base_url` in the collection variables when switching between local dev/prod targets.
- The collection includes `Password Reset Request`, `Password Reset Confirm`, `MFA Enroll`, and `MFA Verify` requests under `Supplementary Account Security`.
- These routes live under `/auth/security/*` because they harden user-account operations across JWT, Sessions, and OAuth rather than belonging to one auth model.
- Treat this section as supplementary production hardening rather than part of the primary OAuth vs JWT vs Sessions comparative evaluation.

## PKCE Startup Helper

By default, the server does not print a PKCE `code_challenge` and `code_verifier` on startup.

- Optional opt-in in any environment:

```powershell
$env:LOG_PKCE_STARTUP="true"
```

## Dual Reviewer Confirmation Gates

Before I submit, two independent reviewers sign off:

- **Reviewer 1** – Checks that AI integration didn't corrupt the baseline methodology
- **Reviewer 2** – Validates the statistics, attack coverage, and reproducibility

Both must approve before I lock down the evidence.

See [docs/Two-Reviewer_Requirements.md](docs/Two-Reviewer_Requirements.md) for the full sign-off criteria and what each reviewer checks.

Once approved, I run `npm run freeze:offline` to lock the evidence for submission.

## Ready to Submit?

Before I push this to the committee:

1. ✓ `npm run run:all:offline` completes end-to-end
2. ✓ `npm run docs:check` passes
3. ✓ `npm run freeze:verify` confirms the lock is solid
4. ✓ Both reviewers have signed off (see Dual Reviewer Confirmation Gates)
5. ✓ Dissertation appendices are in place (proposal, ethics, design spec)
6. ✓ IT storage path and demo video URL are set

## License

MIT

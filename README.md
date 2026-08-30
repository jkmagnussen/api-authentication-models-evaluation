# API Authentication Models Evaluation

This backend evaluates three API authentication models:

- Sessions
- JWT
- OAuth 2.0 with PKCE

## Prerequisites

- Node.js 18+
- PostgreSQL
- Optional: Redis for session storage

## Quick Start

```bash
npm install
npm run db:setup
npm run dev
```

Then verify the app is healthy:

```bash
npm run healthcheck
```

Create a `.env` file with either:

- `DATABASE_URL`, or
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

## Script Guide

Use this section as a command map by goal.

### Core

- `npm run dev`: run app in development mode (ts-node)
- `npm run build`: compile TypeScript
- `npm run start`: run compiled app
- `npm run prod`: build then run compiled app

### Database

- `npm run db:generate`: generate Prisma client
- `npm run db:migrate`: apply migrations
- `npm run db:seed`: reseed canonical data
- `npm run db:setup`: generate + migrate + seed

### Verification

- `npm run test`: run full Jest suite
- `npm run docs:check`: validate generated docs/artifacts
- `npm run healthcheck`: call `/health/live`
- `npm run verify:full`: prep env, clean artifacts, db generate/migrate/seed, build, test, start server, healthcheck
- `npm run verify:deploy`: `verify:full` + Docker build
- `npm run verify:ci`: `docs:check` + `verify:deploy`

### Docker and Release Tags

- `npm run docker:build`: build local image `dissertation-backend:local`
- `npm run docker:tag`: tag local image for a repo
- `npm run docker:tag:ci`: tag with git-sha and package version
- `npm run docker:publish`: tag and push
- `npm run docker:publish:ci`: tag and push with git-sha + package version..

## Recommended Workflows:

- Local development: `npm run db:setup` then `npm run dev`
- Pre-merge confidence: `npm run verify:ci`
- Release candidate check: `npm run verify:deploy`
- Staging publish: `npm run docker:publish:ci`

### First Run on macOS

Use this sequence on a fresh Mac clone to avoid cross-platform artifact drift

```bash
rm -rf node_modules
npm ci
npm run db:setup
npm run build
npm test
npm run verify:full
```

Notes:

- `npm test` now runs `npm run prepare:env` first via `pretest`, so test runs use a normalized `DATABASE_URL` before Jest starts.
- Runtime config loads `.env` directly, so app/test execution and Prisma CLI commands resolve database settings consistently.

If `verify:full` reports a port conflict, stop any process already listening on port `3001` and rerun.

### Troubleshooting: macOS vs Windows

If tests fail on macOS but pass on Windows with errors like:

- `PrismaClientInitializationError`
- `User was denied access on the database '(not available)'`

check the following in order:

1. Verify `.env` has the intended `DATABASE_URL` credentials for your local Postgres user.
2. Run `npm run prepare:env` once and confirm it prints the expected host/port/database.
3. Run `npm run db:setup` to ensure Prisma can connect, migrate, and seed.
4. Run `npm test` (this now runs `pretest` and prepares env before Jest).

Why this happens:

- Cross-platform shells and local Postgres defaults can differ.
- This project now normalizes `DATABASE_URL` before test runs and loads `.env` at runtime to keep Prisma CLI and Jest/app behavior aligned.

Common examples:

```bash
IMAGE_REPO=ghcr.io/your-org/dissertation-backend npm run docker:tag
IMAGE_REPO=ghcr.io/your-org/dissertation-backend IMAGE_ALIAS=staging npm run docker:publish:ci
```

Tagging notes:

- `IMAGE_REPO` is required
- `IMAGE_TAG` defaults to `git-<shortsha>` when not provided
- `IMAGE_WITH_VERSION=true` (or `--with-version`) adds `v<package.json version>`
- `IMAGE_ALIAS` is optional (`staging`, `prod`, etc.)
- Prefer immutable tags (`git-*`, `v*`) for deployments

## CI/CD Workflows

- `.github/workflows/ci-verify.yml`: runs `npm run verify:ci` on PRs/pushes to `main`
- `.github/workflows/staging-publish.yml`: manual staging image publish workflow

Staging publish workflow inputss:

- `image_repo`: target image repository
- `image_alias`: mutable alias tag (default `staging`)
- `publish`: when `false`, performs a dry-run tag step only.

Authentication notes

- Publish mode logs in to `ghcr.io` using `${{ github.actor }}` and `${{ secrets.GITHUB_TOKEN }}`.
- Ensure the repository has `packages: write` permission enabled for workflows.

Recommended: require `verify-ci` in branch protection for `main`.

## Production Notes

`npm run prod` does not run cleanup, Prisma generate, migrations, or seed.
Run `npm run db:setup` first when deploying to a fresh or drifted database.

## Useful Files

- [routes.md](routes.md): route reference
- [postman.json](postman.json): Postman collection
- [docs/REPRODUCIBILITY_CHECKLIST.md](docs/REPRODUCIBILITY_CHECKLIST.md): full run checklist

## License....

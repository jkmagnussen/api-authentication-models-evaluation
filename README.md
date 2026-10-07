# API Authentication Evaluation

This repository contains three authentication models: database-backed Sessions, JWT, and OAuth 2.0 with PKCE. It includes secure implementations, deliberately weakened variants, attack tests, performance studies, and an evaluation of AI-generated examples.

## Run Locally

You need Node.js 18+ and PostgreSQL. Redis is not required for the local setup.

```powershell
npm ci
Copy-Item .env.example .env
# Set DATABASE_URL in .env for your local PostgreSQL instance.
npm run db:setup
npm run dev
```

Before the first local Postman login, run `npm run db:setup` against a fresh or disposable database. It applies migrations, then clears and reseeds the database with the Postman demo account `main@example.com` / `password123`. The automated-test account `user-123` is only a test fixture; it is not seeded for app use. Users do not need to re-run `db:setup` every time you start the app. It deletes existing application data, so do not run it against data you need to keep.

`npm run dev` stays in the foreground. Keep it running in one terminal; in another, run:

```powershell
npm run healthcheck
```

That checks `/health/live`. To check database readiness, open `http://localhost:3001/health/ready`. The Docker image contains only the API; there is no Compose stack.

## Tests and Build

**Use a disposable database for database-backed tests.** Standard integration and attack tests, variant tests, and performance collectors reset authentication tables. Do not point these commands at data you need to keep.

```powershell
npm run build
npm test
npm run test:variants
npm run docs:check
```

`npm run build` compiles TypeScript into `dist`; it does not start the API. Use `npm run dev` during development or `npm start` to run the compiled build.

`npm test` runs the standard suite. It excludes the nine weakened variants and the baseline/attack performance collection tests, which write timing files. Run variants separately with `npm run test:variants`; to run one variant, add `-- --variant <variant-name>`. `npm run docs:check` only checks that expected files exist; it does not regenerate them.

For a new, provenance-recorded protocol-v7 performance block, use `npm run perf:once`, then `npm run perf:analyze`. Do not run the individual performance suites through ordinary Jest; they write top-level convenience outputs. `npm run perf:once` keeps collection in a matched block.

**Destructive wrapper:** `npm run verify:full`, `npm run verify:deploy`, and `npm run verify:ci` clean ignored generated artifacts and reseed the database. Use a disposable checkout and database if you need to run them.

## Current Evidence

- [Protocol-v7 performance analysis](docs/performance-results/analysis.md) covers 30 matched sequential blocks. It measures protected-resource latency, including invalid-credential rejection; derived throughput is not concurrent capacity.
- [Concurrent-load analysis](docs/performance-results/concurrent-load-v1/analysis.md) is a separate five-block exploratory study at concurrency 1, 10, and 50. Do not pool it with protocol v7 or present it as production-capacity evidence.
- [Blinded AI results](docs/generated/AI_PROVIDER_PROMPT_COMPARISON_BLINDED.md) and [unblinded AI results](docs/generated/AI_PROVIDER_PROMPT_COMPARISON.md) use the isolated protocol-v2 cohort: 360 outputs across four provider/prompt arms. There are 342 heuristic failures; results are descriptive because OpenAI system fingerprints differ between prompt conditions, so paired inference is suppressed.
- AI failures mean that one or more static heuristic checks failed. They are not runtime vulnerability rates or human security ratings. Independent human ratings have not been collected. Other retained AI-vs-human reports and some footprint summaries use legacy data; they are labeled historical and should not be combined with the clean cohort.
- `npm run ai:audit:packet` creates a blinded 36-output review packet. Keep `docs/generated/AI_HEURISTIC_AUDIT_KEY_RESTRICTED.json` from reviewers until their ratings are locked.
- Live AI generation is blocked by the offline freeze by default. Preview a collection without provider calls using `npm run ai:matrix:cohorts -- --plan`. Follow the [reproducibility checklist](docs/REPRODUCIBILITY_CHECKLIST.md) before any live run.

## Docker

Build the API image with `npm run docker:build`. PostgreSQL is not included; set a `DATABASE_URL` reachable from inside the container. With Docker Desktop, use `host.docker.internal` rather than `localhost` to reach a database on the host. Local `.env` files are excluded from the build context.

## References

- [Routes](routes.md)
- [Postman collection](postman.json)
- [Reproducibility checklist](docs/REPRODUCIBILITY_CHECKLIST.md)
- [Dissertation template guide](docs/DISSERTATION_TEMPLATE_GUIDE.md)

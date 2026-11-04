# API Authentication Evaluation

Joseph Karl Magnussen  
MSc Computer Science Dissertation Artifact (11/26)

This project compares database-backed Sessions, JWT, and OAuth 2.0 with PKCE using the same API. It includes secure and intentionally weaker implementations, security testing, performance testing, and an evaluation of AI-generated code.

## Statement on AI use

I designed the study and built the project, and I wrote the dissertation myself. I used GitHub Copilot in a limited, supporting role: to help run some git operations (such as staging, committing and pushing), to summarise material, to support some boilerplate code, and to improve the wording. I reviewed and take responsibility for all submitted work.

## Quick start

Requires Node.js 22+ and PostgreSQL. Redis is not needed.

```powershell
npm ci
Copy-Item .env.example .env
# Set DATABASE_URL in .env.
npm run db:setup
npm run dev
```

Run `npm run db:setup` before starting the API. It applies the migrations and seeds the application data, and the API will not work correctly with `npm run dev` alone on an unseeded database. The command resets and reseeds the data, so use a fresh or disposable database.

I used TablePlus to inspect the database during development. After seeding, refreshing the users table should show the seeded user data in place of the test user.

Then start the API with `npm run dev` and check liveness with `npm run healthcheck`, or database readiness at `http://localhost:3001/health/ready` (adjust the port if you changed `PORT` in `.env`).

## Build and tests

Use a disposable database for database-backed tests; they reset authentication tables.

```powershell
npm run build
npm run lint
npm run security:audit
npm test
npm run test:variants
npm run docs:check
```

The standard test suite excludes the nine deliberately weakened variants; run them separately with `npm run test:variants`. `npm run docs:check` checks for expected generated files but does not regenerate them. The verification wrappers `verify:full`, `verify:deploy`, and `verify:ci` also clean generated artifacts and reseed the database.

## Evidence

- [Current-source protocol-v7 performance results](docs/performance-results/current-source-v7-20261017/analysis.md): 30 matched sequential blocks collected against the authentication source and dependency lockfile as of 2026-10-17. The lockfile has since been updated to address a `body-parser` security advisory, so these results were not collected with the current dependency set. See the [revalidation record](docs/CURRENT_SOURCE_REVALIDATION.md). These measure protected-resource latency, including invalid-credential rejection; derived throughput is not concurrent capacity.
- [Earlier 12 October protocol-v7 results](docs/performance-results/current-source-v7-20261012/analysis.md) are retained for provenance; their source fingerprints do not match the current checkout.
- [Historical protocol-v7 results](docs/performance-results/analysis.md) are retained for provenance and use an earlier source snapshot. Do not combine them with the current-source results.
- [Concurrent-load results](docs/performance-results/concurrent-load-v1/analysis.md) are a separate, exploratory five-block study; they are not production-capacity evidence.
- [Blinded AI results](docs/generated/AI_PROVIDER_PROMPT_COMPARISON_BLINDED.md) and [unblinded results](docs/generated/AI_PROVIDER_PROMPT_COMPARISON.md): 360 outputs, with 342 triggering at least one static heuristic. These are not runtime vulnerability rates or human ratings. Provider comparisons are descriptive; differing OpenAI system fingerprints prevent confirmatory paired inference.

## More information

- [Reproducibility checklist](docs/REPRODUCIBILITY_CHECKLIST.md) — evidence-generation steps and interpretation cautions.
- [API routes](routes.md)
- [Postman collection](postman.json)
- [Charts](docs/charts/README.md)
- [Diagrams](docs/diagrams/README.md)

To build the API Docker image, run `npm run docker:build`. PostgreSQL is not included; configure `DATABASE_URL` to point to a database reachable from the container. Local `.env` files are excluded from the build context.

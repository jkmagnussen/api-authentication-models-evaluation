# API Authentication Evaluation

Compare database-backed Sessions, JWT, and OAuth 2.0 with PKCE in a shared API. The repository includes secure implementations, deliberately weakened variants, security tests, performance studies, and a static evaluation of AI-generated code.

## Quick start

Requires Node.js 22+ and PostgreSQL. Redis is not needed.

```powershell
npm ci
Copy-Item .env.example .env
# Set DATABASE_URL in .env.
npm run db:setup
npm run dev
```

`npm run db:setup` applies migrations and resets/reseeds application data. Use a fresh or disposable database; do not run it against data you need to keep. Start the API with `npm run dev`, then check liveness with `npm run healthcheck` or database readiness at `http://localhost:3001/health/ready`.

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

- [Current-source protocol-v7 performance results](docs/performance-results/current-source-v7-20261017/analysis.md): 30 matched sequential blocks collected against the current authentication source and dependency lockfile. See the [revalidation record](docs/CURRENT_SOURCE_REVALIDATION.md). These measure protected-resource latency, including invalid-credential rejection; derived throughput is not concurrent capacity.
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

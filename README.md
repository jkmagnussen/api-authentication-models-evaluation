# API Authentication Evaluation

Joseph Karl Magnussen  
MSc Computer Science Dissertation Artifact (11/26)

This project compares database-backed Sessions, JWT, and OAuth 2.0 with PKCE using the same API. It includes secure and intentionally weaker implementations, along with security testing, performance testing, and an evaluation of AI-generated code.

## Quick start

Requires Node.js 22+ and PostgreSQL. Redis is not needed.

```powershell
npm ci
Copy-Item .env.example .env
# Set DATABASE_URL in .env.
npm run db:setup
npm run dev
```

Run npm run db:setup before starting the API. This applies the migrations and seeds the application data. Running npm run dev on its own will not work correctly if the database has not been seeded first. The setup command resets and reseeds the data, so use a fresh or disposable database.

I used TablePlus to inspect the database during development. After running the setup, refreshing the users table should show the seeded user data in place of the test user.

Once the database is set up, start the API with npm run dev. You can then run npm run healthcheck to check the API, or use http://localhost:3001/health/ready to check database readiness. If you changed PORT in .env, update the port accordingly.

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

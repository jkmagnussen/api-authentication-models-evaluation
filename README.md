# API Authentication Models Evaluation

This project evaluates three API authentication models in one backend:

- Sessions
- JWT
- OAuth 2.0 with PKCE

## Prerequisites

- Node.js 18 or newer
- PostgreSQL running locally
- Optional: Redis for session storage

## Development workflow

1. Install dependencies:
   - `npm install`
2. Create a `.env` file with either `DATABASE_URL` or the DB override variables `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME`.
3. Prepare the environment and database:
   - `npm run db:setup`
   - This runs Prisma client generation, applies migrations, and seeds the database.
4. Start the app in development mode:
   - `npm run dev`

### Useful development commands

- `npm run dev` - start the app locally with ts-node
- `npm run build` - compile the TypeScript app
- `npm run test` - run the Jest suite
- `npm run db:setup` - generate the Prisma client, deploy migrations, and seed the database
- `npm run db:seed` - seed the database only
- `npm run docs:check` - verify generated artifacts
- `npm run docker:build` - build the Docker image

### Dev build checklist

If you want a simple dev build flow, use:

```bash
npm install
npm run db:setup
npm run build
npm run dev
```

## Production workflow

For production, build and start the compiled app:

```bash
npm run build
npm start
```

You can also use the convenience script:

```bash
npm run prod
```

For a full production-style run that also cleans artifacts, applies Prisma migrations, seeds the database, builds the app, and starts it, use:

```bash
npm run prod:full
```

### Does production auto-clean, generate, migrate, and seed?

No. The standard `npm run prod` script currently does the following:

- prepares the environment
- builds the TypeScript app
- starts the compiled server

It does not automatically run:

- artifact cleanup
- Prisma client generation
- database migrations
- database seeding

If the database is not ready yet, run this first:

```bash
npm run db:setup
```

## Port and database notes

- Local development defaults to port `3001`.
- Docker defaults to port `3001` internally.
- If you need to change the app port, set `PORT` before starting the app.
- The environment bootstrap script will also prepare a `.env` `DATABASE_URL` from your DB settings.
- Set a local `SESSION_SECRET` in your `.env` file for development, for example `SESSION_SECRET="local-dev-session-secret-2026"`.

## Useful files

- [routes.md](routes.md) - route reference
- [postman.json](postman.json) - Postman collection
- [docs/REPRODUCIBILITY_CHECKLIST.md](docs/REPRODUCIBILITY_CHECKLIST.md) - full run checklist

## License

MIT

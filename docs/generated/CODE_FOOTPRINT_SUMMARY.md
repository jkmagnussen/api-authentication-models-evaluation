# Code Footprint Summary

Generated: 2026-07-21T18:00:25.905Z
Regenerate: npm run code:footprint

## Scope Rules

- Baseline counts cover only model-owned implementation files under `src/<model>`.
- Shared infrastructure such as `src/db.ts`, Prisma schema/migrations, server bootstrap, tests, and Postman collections is intentionally excluded.
- Misconfiguration counts are measured as the baseline slice plus the active override files (`app.variant.ts`, `*.config.ts`, and shared override plumbing).
- AI-generated counts cover the standalone contents of each `sampleX.ts` file only.
- This means baseline and variant counts are runtime-slice counts, not whole-repository counts.

## Baseline Footprints

| Slice | Files | Chars | Lines | Functions | Classes | Constants | Cyclomatic | Avg Maintainability |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| OAUTH Baseline | 6 | 15273 | 542 | 16 | 0 | 58 | 195 | 110.00 |
| JWT Baseline | 4 | 4847 | 155 | 14 | 0 | 19 | 106 | 110.15 |
| SESSIONS Baseline | 4 | 5491 | 175 | 12 | 0 | 15 | 136 | 118.54 |

## Misconfiguration Effective Footprints

| Variant | Files | Chars | Lines | Functions | Classes | Constants | Cyclomatic | Avg Maintainability |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| oauth-redirect-misconfiguration | 10 | 17364 | 621 | 20 | 0 | 60 | 207 | 117.25 |
| oauth-state-misconfiguration | 10 | 17303 | 621 | 20 | 0 | 60 | 207 | 117.36 |
| oauth-scope-misconfiguration | 10 | 17324 | 621 | 20 | 0 | 60 | 207 | 117.24 |
| jwt-audience-misconfiguration | 8 | 6901 | 235 | 18 | 0 | 21 | 118 | 118.92 |
| jwt-algorithm-misconfiguration | 8 | 6891 | 234 | 18 | 0 | 21 | 118 | 119.28 |
| jwt-expiry-misconfiguration | 8 | 6867 | 234 | 18 | 0 | 21 | 118 | 119.28 |
| sessions-fixation-misconfiguration | 8 | 7546 | 254 | 16 | 0 | 17 | 148 | 123.48 |
| sessions-cookie-flag-misconfiguration | 8 | 7598 | 258 | 16 | 0 | 17 | 148 | 122.48 |
| sessions-logout-misconfiguration | 8 | 7525 | 254 | 16 | 0 | 17 | 148 | 123.48 |

## AI-Generated Footprints

| Model | Files | Chars | Lines | Functions | Classes | Constants | Cyclomatic | Avg Maintainability |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| OAUTH AI Samples (Aggregate) | 30 | 22041 | 702 | 42 | 0 | 138 | 1038 | 109.44 |
| JWT AI Samples (Aggregate) | 30 | 26265 | 858 | 60 | 0 | 168 | 66 | 110.52 |
| SESSIONS AI Samples (Aggregate) | 30 | 17541 | 648 | 108 | 0 | 0 | 36 | 131.94 |

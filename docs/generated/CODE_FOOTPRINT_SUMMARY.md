# Code Footprint Summary

Generated: 2026-07-23T03:48:48.544Z
Regenerate: npm run code:footprint:tolerant

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
| jwt-audience-misconfiguration | 8 | 6879 | 234 | 18 | 0 | 21 | 118 | 119.28 |
| jwt-algorithm-misconfiguration | 8 | 6891 | 234 | 18 | 0 | 21 | 118 | 119.28 |
| jwt-expiry-misconfiguration | 8 | 6866 | 234 | 18 | 0 | 21 | 118 | 119.28 |
| sessions-fixation-misconfiguration | 8 | 7546 | 254 | 16 | 0 | 17 | 148 | 123.48 |
| sessions-cookie-flag-misconfiguration | 8 | 7546 | 256 | 16 | 0 | 17 | 148 | 123.08 |
| sessions-logout-misconfiguration | 8 | 7525 | 254 | 16 | 0 | 17 | 148 | 123.48 |

## AI-Generated Footprints

| Model | Files | Chars | Lines | Functions | Classes | Constants | Cyclomatic | Avg Maintainability |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| OAUTH AI Samples (Aggregate) | 30 | 86061 | 3362 | 0 | 0 | 0 | 82 | 118.80 |
| JWT AI Samples (Aggregate) | 30 | 86640 | 3217 | 5 | 0 | 10 | 141 | 118.17 |
| SESSIONS AI Samples (Aggregate) | 30 | 89538 | 3501 | 0 | 0 | 0 | 84 | 118.80 |

## Complexity Parse Failures

| Scope | File | Error |
|---|---|---|
| OAUTH AI Samples (Aggregate) | ai-generated/oauth/sample7.ts | Line 47: Unexpected token : |
| OAUTH AI Samples (Aggregate) | ai-generated/oauth/sample19.ts | Line 13: Unexpected token : |
| OAUTH AI Samples (Aggregate) | ai-generated/oauth/sample27.ts | Line 48: Unexpected token : |
| JWT AI Samples (Aggregate) | ai-generated/jwt/sample8.ts | Line 25: Unexpected token ; |
| JWT AI Samples (Aggregate) | ai-generated/jwt/sample14.ts | Line 28: Unexpected token ( |
| JWT AI Samples (Aggregate) | ai-generated/jwt/sample16.ts | Line 10: Unexpected token : |
| JWT AI Samples (Aggregate) | ai-generated/jwt/sample23.ts | Line 31: Unexpected token : |
| SESSIONS AI Samples (Aggregate) | ai-generated/sessions/sample10.ts | Line 9: Unexpected token : |
| SESSIONS AI Samples (Aggregate) | ai-generated/sessions/sample12.ts | Line 14: Unexpected token : |

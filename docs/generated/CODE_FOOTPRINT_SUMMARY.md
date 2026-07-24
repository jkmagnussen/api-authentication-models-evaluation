# Code Footprint Summary

Generated: 2026-07-24T23:11:15.069Z
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
| OAUTH Baseline | 6 | 16907 | 600 | 18 | 0 | 62 | 209 | 109.69 |
| JWT Baseline | 4 | 5920 | 191 | 9 | 0 | 23 | 112 | 102.31 |
| SESSIONS Baseline | 4 | 6977 | 229 | 12 | 0 | 16 | 146 | 117.09 |

## Misconfiguration Effective Footprints

| Variant | Files | Chars | Lines | Functions | Classes | Constants | Cyclomatic | Avg Maintainability |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| oauth-redirect-misconfiguration | 10 | 19205 | 684 | 22 | 0 | 64 | 221 | 117.06 |
| oauth-state-misconfiguration | 10 | 19100 | 684 | 22 | 0 | 64 | 221 | 117.18 |
| oauth-scope-misconfiguration | 10 | 19214 | 684 | 22 | 0 | 64 | 221 | 117.05 |
| jwt-audience-misconfiguration | 8 | 8181 | 275 | 13 | 0 | 25 | 124 | 115.36 |
| jwt-algorithm-misconfiguration | 8 | 8203 | 275 | 13 | 0 | 25 | 124 | 115.36 |
| jwt-expiry-misconfiguration | 8 | 8138 | 275 | 13 | 0 | 25 | 124 | 115.36 |
| sessions-fixation-misconfiguration | 8 | 9222 | 313 | 16 | 0 | 18 | 158 | 122.75 |
| sessions-cookie-flag-misconfiguration | 8 | 9202 | 315 | 16 | 0 | 18 | 158 | 122.35 |
| sessions-logout-misconfiguration | 8 | 9202 | 313 | 16 | 0 | 18 | 158 | 122.75 |

## AI-Generated Footprints

| Model | Files | Chars | Lines | Functions | Classes | Constants | Cyclomatic | Avg Maintainability |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| OAUTH AI Samples (Aggregate) | 30 | 87109 | 3392 | 0 | 0 | 3 | 73 | 118.80 |
| JWT AI Samples (Aggregate) | 30 | 77141 | 2897 | 18 | 0 | 45 | 155 | 117.68 |
| SESSIONS AI Samples (Aggregate) | 30 | 81403 | 3176 | 29 | 0 | 23 | 93 | 121.40 |

## Complexity Parse Failures

| Scope | File | Error |
|---|---|---|
| OAUTH AI Samples (Aggregate) | ai-generated/oauth/sample2.ts | Line 31: Unexpected token ; |
| OAUTH AI Samples (Aggregate) | ai-generated/oauth/sample3.ts | Line 47: Unexpected token ( |
| OAUTH AI Samples (Aggregate) | ai-generated/oauth/sample4.ts | Line 29: Unexpected token ; |
| OAUTH AI Samples (Aggregate) | ai-generated/oauth/sample7.ts | Line 47: Unexpected token : |
| OAUTH AI Samples (Aggregate) | ai-generated/oauth/sample19.ts | Line 13: Unexpected token : |
| OAUTH AI Samples (Aggregate) | ai-generated/oauth/sample27.ts | Line 48: Unexpected token : |
| JWT AI Samples (Aggregate) | ai-generated/jwt/sample8.ts | Line 25: Unexpected token ; |
| JWT AI Samples (Aggregate) | ai-generated/jwt/sample14.ts | Line 28: Unexpected token ( |
| JWT AI Samples (Aggregate) | ai-generated/jwt/sample16.ts | Line 10: Unexpected token : |
| JWT AI Samples (Aggregate) | ai-generated/jwt/sample23.ts | Line 31: Unexpected token : |
| SESSIONS AI Samples (Aggregate) | ai-generated/sessions/sample10.ts | Line 9: Unexpected token : |
| SESSIONS AI Samples (Aggregate) | ai-generated/sessions/sample12.ts | Line 14: Unexpected token : |

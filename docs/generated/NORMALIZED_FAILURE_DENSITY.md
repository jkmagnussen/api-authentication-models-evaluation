# Normalized Failure Density

Generated: 2026-07-24T23:11:15.721Z
Regenerate: npm run code:footprint:tolerant

This exploratory report normalizes observed security failures against implementation footprint to compare baseline, misconfiguration, and AI-generated slices without over-weighting raw size alone.

## Interpretation Rules

- Baseline rows show zero observed security failures by design; they provide denominator context only.
- Misconfiguration rows use the mean effective footprint across the model's intentional variants, with failure events counted from exploit-positive focused proof passes.
- AI rows use aggregate AI sample footprint and observed failed samples from ai-samples-summary.csv.
- Failure points count distinct independent failure/control categories, not literal code branches.

## Model-Level Density Summary

| Model | Source | Chars | Lines | Functions | Cyclomatic | Failure Events | Failure Points | Failures / 10k Chars | Failures / 100 LOC | Failures / 10 Functions | Failure Points / 10k Chars |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| OAuth2 | baseline | 16907 | 600 | 18 | 209 | 0 | 0 | 0.000 | 0.000 | 0.000 | 0.000 |
| JWT | baseline | 5920 | 191 | 9 | 112 | 0 | 0 | 0.000 | 0.000 | 0.000 | 0.000 |
| Session | baseline | 6977 | 229 | 12 | 146 | 0 | 0 | 0.000 | 0.000 | 0.000 | 0.000 |
| OAuth2 | misconfiguration | 19173 | 684 | 22 | 221 | 3 | 3 | 0.522 | 0.146 | 1.364 | 1.565 |
| JWT | misconfiguration | 8174 | 275 | 13 | 124 | 3 | 3 | 1.223 | 0.364 | 2.308 | 3.670 |
| Session | misconfiguration | 9209 | 314 | 16 | 158 | 3 | 3 | 1.086 | 0.319 | 1.875 | 3.258 |
| OAuth2 | ai | 87109 | 3392 | 0 | 73 | 27 | 3 | 3.100 | 0.796 | 0.000 | 0.344 |
| JWT | ai | 77141 | 2897 | 18 | 155 | 3 | 1 | 0.389 | 0.104 | 1.667 | 0.130 |
| Session | ai | 81403 | 3176 | 29 | 93 | 4 | 2 | 0.491 | 0.126 | 1.379 | 0.246 |

## Variant-Level Density Detail

| Variant | Model | Chars | Lines | Functions | Cyclomatic | Failure Event | Failures / 10k Chars | Failures / 100 LOC |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| oauth-redirect-misconfiguration | OAUTH | 19205 | 684 | 22 | 221 | 1 | 0.521 | 0.146 |
| oauth-state-misconfiguration | OAUTH | 19100 | 684 | 22 | 221 | 1 | 0.524 | 0.146 |
| oauth-scope-misconfiguration | OAUTH | 19214 | 684 | 22 | 221 | 1 | 0.520 | 0.146 |
| jwt-audience-misconfiguration | JWT | 8181 | 275 | 13 | 124 | 1 | 1.222 | 0.364 |
| jwt-algorithm-misconfiguration | JWT | 8203 | 275 | 13 | 124 | 1 | 1.219 | 0.364 |
| jwt-expiry-misconfiguration | JWT | 8138 | 275 | 13 | 124 | 1 | 1.229 | 0.364 |
| sessions-fixation-misconfiguration | SESSIONS | 9222 | 313 | 16 | 158 | 1 | 1.084 | 0.319 |
| sessions-cookie-flag-misconfiguration | SESSIONS | 9202 | 315 | 16 | 158 | 1 | 1.087 | 0.317 |
| sessions-logout-misconfiguration | SESSIONS | 9202 | 313 | 16 | 158 | 1 | 1.087 | 0.319 |

## Notes

- Use these density figures as exploratory normalization aids, not confirmatory causal estimates.
- A higher density indicates more observed failures relative to footprint, not necessarily stronger exploit severity.

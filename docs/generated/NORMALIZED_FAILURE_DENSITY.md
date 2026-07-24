# Normalized Failure Density

Generated: 2026-07-24T11:49:18.388Z
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
| OAuth2 | baseline | 17703 | 613 | 19 | 209 | 0 | 0 | 0.000 | 0.000 | 0.000 | 0.000 |
| JWT | baseline | 5934 | 160 | 9 | 112 | 0 | 0 | 0.000 | 0.000 | 0.000 | 0.000 |
| Session | baseline | 6974 | 201 | 12 | 146 | 0 | 0 | 0.000 | 0.000 | 0.000 | 0.000 |
| OAuth2 | misconfiguration | 19760 | 692 | 23 | 221 | 3 | 3 | 0.506 | 0.145 | 1.304 | 1.518 |
| JWT | misconfiguration | 7966 | 239 | 13 | 124 | 3 | 3 | 1.255 | 0.418 | 2.308 | 3.766 |
| Session | misconfiguration | 9022 | 281 | 16 | 158 | 3 | 3 | 1.108 | 0.356 | 1.875 | 3.325 |
| OAuth2 | ai | 87109 | 3392 | 0 | 73 | 27 | 3 | 3.100 | 0.796 | 0.000 | 0.344 |
| JWT | ai | 77141 | 2897 | 18 | 155 | 3 | 1 | 0.389 | 0.104 | 1.667 | 0.130 |
| Session | ai | 81403 | 3176 | 29 | 93 | 4 | 2 | 0.491 | 0.126 | 1.379 | 0.246 |

## Variant-Level Density Detail

| Variant | Model | Chars | Lines | Functions | Cyclomatic | Failure Event | Failures / 10k Chars | Failures / 100 LOC |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| oauth-redirect-misconfiguration | OAUTH | 19794 | 692 | 23 | 221 | 1 | 0.505 | 0.145 |
| oauth-state-misconfiguration | OAUTH | 19733 | 692 | 23 | 221 | 1 | 0.507 | 0.145 |
| oauth-scope-misconfiguration | OAUTH | 19754 | 692 | 23 | 221 | 1 | 0.506 | 0.145 |
| jwt-audience-misconfiguration | JWT | 7966 | 239 | 13 | 124 | 1 | 1.255 | 0.418 |
| jwt-algorithm-misconfiguration | JWT | 7978 | 239 | 13 | 124 | 1 | 1.253 | 0.418 |
| jwt-expiry-misconfiguration | JWT | 7953 | 239 | 13 | 124 | 1 | 1.257 | 0.418 |
| sessions-fixation-misconfiguration | SESSIONS | 9029 | 280 | 16 | 158 | 1 | 1.108 | 0.357 |
| sessions-cookie-flag-misconfiguration | SESSIONS | 9029 | 282 | 16 | 158 | 1 | 1.108 | 0.355 |
| sessions-logout-misconfiguration | SESSIONS | 9008 | 280 | 16 | 158 | 1 | 1.110 | 0.357 |

## Notes

- Use these density figures as exploratory normalization aids, not confirmatory causal estimates.
- A higher density indicates more observed failures relative to footprint, not necessarily stronger exploit severity.

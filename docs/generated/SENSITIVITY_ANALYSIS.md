# Sensitivity Analysis

Generated: 2026-07-24T18:13:33.164Z
Regenerate: npm run compare:reports

This exploratory analysis tests whether model risk ordering is stable under alternative severity weighting schemes.

| Model | Scheme A (equal) | Scheme B (severity-heavy) | Rank A | Rank B |
|---|---:|---:|---:|---:|
| OAUTH | 3.75 | 3.97 | 1 | 2 |
| JWT | 3.67 | 4.00 | 2 | 1 |
| SESSIONS | 3.42 | 3.83 | 3 | 3 |

Ranking stability: oauth > jwt > sessions (Scheme A) vs jwt > oauth > sessions (Scheme B).
Interpretation: large rank shifts indicate conclusions are sensitive to scoring assumptions and should be presented as exploratory.

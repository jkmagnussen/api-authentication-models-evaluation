# Cognitive Load Index

Generated: 2026-07-24T11:49:22.824Z
Regenerate: npm run analysis:structural

$$
CLI = 1.2P + 1.1F + 1.3L + 1.0B + 1.2V + 1.4M
$$

| Model | Config Points | Security Flags | Lifecycle Steps | Trust Boundary Crossings | Validation Rules | Must-Remember Behaviors | Raw CLI | Normalized CLI (0-100) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| OAuth2 | 8 | 6 | 7 | 5 | 7 | 6 | 47.10 | 100.00 |
| JWT | 7 | 5 | 5 | 3 | 6 | 5 | 37.60 | 79.83 |
| Session | 8 | 5 | 5 | 3 | 5 | 5 | 37.60 | 79.83 |

## Sensitivity Analysis

| Weight Profile | OAuth2 | JWT | Session | Rank Order |
|---|---:|---:|---:|---|
| default | 100.00 | 79.83 | 79.83 | OAuth2 > Session > JWT |
| lifecycle_heavy | 100.00 | 79.08 | 78.87 | OAuth2 > JWT > Session |
| boundary_heavy | 100.00 | 78.06 | 77.85 | OAuth2 > JWT > Session |

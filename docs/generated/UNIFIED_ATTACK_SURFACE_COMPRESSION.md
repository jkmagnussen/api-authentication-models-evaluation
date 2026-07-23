# Unified Attack Surface Compression

Generated: 2026-07-23T20:43:34.239Z
Regenerate: npm run analysis:structural

This report compresses per-model STRIDE breadth, severity, exploitability, and trust-boundary breadth into a single exploratory attack-surface score for cross-model comparison.

| Model | Mean Severity (1-5) | Mean Exploitability (0-10) | Unique STRIDE Classes | Trust Boundary Crossings | UASC Score (0-10) |
|---|---:|---:|---:|---:|---:|
| OAuth2 | 4.00 | 8.33 | 3 | 5 | 8.80 |
| JWT | 4.33 | 8.33 | 3 | 3 | 8.43 |
| Session | 4.33 | 7.67 | 2 | 3 | 7.57 |

## Construction

UASC uses a weighted blend of mean severity, mean exploitability, primary STRIDE breadth, and model-level trust-boundary crossings. The score is repository-scoped and should be read as a comparative compression metric, not as an absolute exposure probability.

## Interpretation

- OAuth2 typically scores highest because it spans more trust boundaries and distinct STRIDE failure classes than the other models.
- JWT compresses to a high but more linear attack surface because fewer trust boundaries are crossed, even though signature and claim mistakes remain severe.
- Sessions usually compress lower on breadth, but individual cookie and revocation weaknesses can still have strong local impact even if the overall surface is narrower.

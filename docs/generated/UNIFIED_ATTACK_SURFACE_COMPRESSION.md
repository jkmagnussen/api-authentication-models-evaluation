# Unified Attack Surface Compression

Generated: 2026-07-23T20:53:27.549Z
Regenerate: npm run analysis:structural

This report compresses per-model STRIDE breadth, severity, exploitability, and trust-boundary breadth into a single exploratory attack-surface score for cross-model comparison.

## Formula

$$
UASC = 10 \times (0.35S + 0.30E + 0.20T + 0.15B)
$$

Where $S$ is mean severity normalized to 0-1, $E$ mean exploitability normalized to 0-1, $T$ primary STRIDE breadth normalized to the repository's three-class spread, and $B$ trust-boundary breadth normalized to the widest modeled boundary count.

## Weight Rationale

- Severity and exploitability dominate because the compressed surface should still privilege actual security consequence over structural breadth alone.
- STRIDE breadth and trust-boundary breadth remain explicit so narrow-but-severe surfaces can be distinguished from broad-and-branching ones.

| Model | Mean Severity (1-5) | Mean Exploitability (0-10) | Unique STRIDE Classes | Trust Boundary Crossings | UASC Score (0-10) |
|---|---:|---:|---:|---:|---:|
| OAuth2 | 4.00 | 8.33 | 3 | 5 | 8.80 |
| JWT | 4.33 | 8.33 | 3 | 3 | 8.43 |
| Session | 4.33 | 7.67 | 2 | 3 | 7.57 |

## Sensitivity Analysis

| Weight Profile | OAuth2 | JWT | Session | Rank Order |
|---|---:|---:|---:|---|
| default | 8.80 | 8.43 | 7.57 | OAuth2 > JWT > Session |
| severity_heavy | 8.58 | 8.52 | 7.85 | OAuth2 > JWT > Session |
| breadth_heavy | 9.27 | 8.20 | 7.07 | OAuth2 > JWT > Session |

## Construction

UASC uses a weighted blend of mean severity, mean exploitability, primary STRIDE breadth, and model-level trust-boundary crossings. The score is repository-scoped and should be read as a comparative compression metric, not as an absolute exposure probability.

## Interpretation

- OAuth2 typically scores highest because it spans more trust boundaries and distinct STRIDE failure classes than the other models.
- JWT compresses to a high but more linear attack surface because fewer trust boundaries are crossed, even though signature and claim mistakes remain severe.
- Sessions usually compress lower on breadth, but individual cookie and revocation weaknesses can still have strong local impact even if the overall surface is narrower.

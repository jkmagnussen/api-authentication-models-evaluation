# ML-Lite Analysis Summary

## Included Analyses

1. Misconfiguration clustering (k-means)
2. Complexity to misconfiguration regression
3. AI determinism and variance
4. STRIDE-based severity scoring
5. Correctness vs security trade-off
6. Cross-provider overlap
7. Provider bias analysis
8. Error diversity entropy
9. Maintainability Difficulty Index
10. Token lifecycle fragility
11. Authentication overhead breakdown
12. Variance under load

## Key Numeric Outputs

- Clustering inertia: 17.333
- Regression R^2: 0.007
- Regression slope: -0.019
- Average AI failure variance (std dev): 0.366
- Mean error diversity entropy: 2.216
- Mean attack-overhead share: 0.081
- Mean load-variance index: 43.932

## Notes

- These additions are best interpreted as exploratory enhancements unless preregistered as confirmatory.
- Overhead breakdown is an estimate from phase-weighted decomposition of measured latency.
- Variance-under-load uses repeated-run CV when available, otherwise tail-spread amplification.
- Canonical source data remains under docs/generated, docs/performance-results, and ai-generated/arms.

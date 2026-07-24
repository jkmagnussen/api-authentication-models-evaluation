# Charts Catalog

Charts are split into two tiers:

- `primary/`: main narrative charts
- `supporting/`: overlap/context charts retained for appendix use

## Primary Charts

| Chart | Description |
|---|---|
| `primary/performance/runtime-latency-comparison-ci.svg` | Baseline versus attack latency with confidence intervals. |
| `primary/performance/authentication-overhead-breakdown.svg` | Phase-weighted authentication overhead decomposition. |
| `primary/performance/variance-under-load.svg` | Latency spread and run-to-run stability under load. |
| `primary/security/ai-vs-human-severity-gap-ci.svg` | Severity-weighted AI risk gap with bootstrap intervals. |
| `primary/security/security-critical-control-risk-density.svg` | Weighted risk density at critical control points. |
| `primary/security/normalized-failure-density.svg` | Failure density normalized by code footprint. |
| `primary/security/misconfiguration-frequency-comparison.svg` | Misconfiguration frequency by model and source. |
| `primary/security/misconfiguration-severity-heatmap.svg` | Severity intensity by misconfiguration type and model. |
| `primary/security/ai-failure-rates.svg` | AI-generated implementation failure rates by model. |
| `primary/security/ai-vs-human-dominance-heatmap.svg` | Dominance view of baseline versus AI safety outcomes. |
| `primary/security/token-lifecycle-fragility.svg` | Fragility across token/session lifecycle phases. |
| `primary/maintainability/ai-sample-syntax-issues-by-model-stage.svg` | Syntax and structural issue rates by stage/model. |
| `primary/maintainability/code-footprint-deltas.svg` | Relative code-footprint deltas versus baseline. |
| `primary/maintainability/complexity-vs-misconfig-frequency-regression.svg` | Complexity versus misconfiguration-frequency regression. |
| `primary/maintainability/failure-points-vs-chars.svg` | Failure concentration relative to code size. |
| `primary/maintainability/maintainability-difficulty-index.svg` | Normalized maintainability difficulty index by model. |
| `primary/synthesis/correctness-vs-security-provider-scatter.svg` | Correctness-security trade-off positioning by provider. |
| `primary/synthesis/cross-provider-overlap-venn.svg` | Shared versus unique failure categories by provider. |
| `primary/synthesis/ai-determinism-variance.svg` | Stability variance across provider prompt arms. |
| `primary/synthesis/error-diversity-entropy.svg` | Entropy of failure diversity by provider arm. |
| `primary/synthesis/misconfiguration-clustering-kmeans.svg` | K-means grouping of misconfiguration profiles. |
| `primary/synthesis/calibration-and-agreement-controls.svg` | Calibration and checker agreement controls. |

## Supporting Charts

| Chart | Why Supporting |
|---|---|
| `supporting/performance/performance-comparison.svg` | Context summary that overlaps with CI and variance charts. |
| `supporting/security/control-point-risk-heatmap.svg` | Detailed control matrix supporting risk-density interpretation. |
| `supporting/security/stride-severity-scoring.svg` | Alternative severity framing alongside heatmap-level severity. |
| `supporting/maintainability/complexity-to-misconfig-regression.svg` | Secondary regression view similar to complexity-frequency trend. |
| `supporting/synthesis/correctness-security-tradeoff.svg` | Alternate trade-off visual for appendix-level comparison. |
| `supporting/synthesis/provider-bias-analysis.svg` | Additional provider-pattern context beyond overlap and entropy. |

For full derivation and sensitivity details, see:

- `docs/generated/FAILURE_PROPAGATION_ANALYSIS.md`
- `docs/generated/COGNITIVE_LOAD_INDEX.md`
- `docs/generated/CROSS_REFERENCE_SYNTHESIS.md`

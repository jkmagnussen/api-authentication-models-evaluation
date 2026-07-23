# Charts Catalog

## Hard Evidence

- `ai-sample-syntax-issues-by-model-stage.svg` - direct syntax, type, and complexity issue counts by model and stage.
- `runtime-latency-comparison-ci.svg` - measured baseline versus attack latency with confidence intervals and performance deltas.
- `code-footprint-deltas.svg` - percent footprint deltas relative to baseline across characters, lines, functions, and cyclomatic complexity.
- `normalized-failure-density.svg` - failure events normalized by character footprint across baseline, misconfiguration, and AI slices.
- `security-critical-control-risk-density.svg` - average weighted risk density across security-critical control points.
- `control-point-risk-heatmap.svg` - per-control risk density map across misconfiguration and AI sources.
- `ai-vs-human-severity-gap-ci.svg` - observed severity-weighted AI risk gap with 95% bootstrap confidence intervals.

## Methodology Controls

- `calibration-and-agreement-controls.svg` - false-confidence calibration and independent checker agreement.

## Supporting Evidence

- `misconfiguration-clustering-kmeans.svg` - k-means clusters of misconfigurations.
- `complexity-to-misconfig-regression.svg` - regression line from complexity to risk index.
- `ai-determinism-variance.svg` - failure-rate variability across provider arms.
- `stride-severity-scoring.svg` - average severity by primary STRIDE class.
- `correctness-security-tradeoff.svg` - trade-off view with latency as bubble size.
- `cross-provider-overlap-venn.svg` - shared vs unique provider failure categories.
- `provider-bias-analysis.svg` - failure fingerprint heatmap by provider arm.
- `misconfiguration-frequency-comparison.svg` - observed issue frequency across proper, misconfigured, and AI-generated sources.
- `misconfiguration-severity-heatmap.svg` - severity intensity by misconfiguration type and model.
- `correctness-vs-security-provider-scatter.svg` - correctness-security trade-offs across Local, OpenAI, and Claude.
- `complexity-vs-misconfig-frequency-regression.svg` - regression of complexity against observed issue frequency.

## Proxy / Exploratory

- `error-diversity-entropy.svg` - Shannon entropy of failure diversity by arm.
- `maintainability-difficulty-index.svg` - normalized maintainability difficulty by model.
- `token-lifecycle-fragility.svg` - fragility profile for JWT and OAuth lifecycle steps.
- `authentication-overhead-breakdown.svg` - estimated latency decomposition by auth stage.
- `variance-under-load.svg` - load-variance chart from repeated runs or tail-spread fallback.
- `failure-points-vs-chars.svg` - distinct failure-point concentration against character footprint.
- `ai-vs-human-dominance-heatmap.svg` - baseline dominance map across core safety metrics by model.
- `ai-vs-human-green-waste-multiplier.svg` - compute-per-secure-outcome proxy multiplier of AI vs baseline.

## Context Charts

- `ai-failure-rates.svg` - baseline context chart for model-level AI failure rates.
- `performance-comparison.svg` - baseline context chart for latency under attack.

# Charts Catalog

Charts are organised into four insight clusters. Each cluster maps to a distinct research dimension.
Within each cluster, charts are ordered from primary evidence to supporting context.

---

## Cluster A — Performance

These charts establish the runtime cost of each authentication model and how that cost behaves under attack and load.

| Chart | Description |
|---|---|
| `performance/runtime-latency-comparison-ci.svg` | Measured baseline versus attack latency with 95% confidence intervals and delta annotation. **Primary evidence.** |
| `performance/performance-comparison.svg` | Side-by-side latency context across JWT, OAuth2, and Sessions under normal and attack conditions. |
| `performance/authentication-overhead-breakdown.svg` | Estimated latency decomposition by authentication stage (token issue, validation, refresh). |
| `performance/variance-under-load.svg` | Tail-spread and jitter across repeated runs; identifies unstable performers. |

**Cluster A interpretation:** JWT consistently shows the lowest absolute latency and the tightest CI, confirming its advantage for high-throughput paths. OAuth2 carries the highest overhead but distributes it predictably across clearly defined stages. Session-based auth shows the widest variance under load, making it the least suitable for latency-sensitive deployments. AI-generated implementations add a small but consistent overhead multiplier even when functionally correct, suggesting the cost of AI code is not purely in security failures.

---

## Cluster B — Security Behaviour

These charts document how misconfigurations and AI-generated code affect security outcomes, mapped through the STRIDE framework and attack evidence.

| Chart | Description |
|---|---|
| `security/ai-vs-human-severity-gap-ci.svg` | Severity-weighted AI risk gap with 95% bootstrap confidence intervals. **Primary evidence.** |
| `security/security-critical-control-risk-density.svg` | Average weighted risk density across security-critical control points. **Primary evidence.** |
| `security/control-point-risk-heatmap.svg` | Per-control risk density map across misconfiguration and AI sources. |
| `security/normalized-failure-density.svg` | Failure events normalised by character footprint across baseline, misconfiguration, and AI slices. |
| `security/stride-severity-scoring.svg` | Average severity score by primary STRIDE category, disaggregated by model. |
| `security/misconfiguration-severity-heatmap.svg` | Severity intensity by misconfiguration type and authentication model. |
| `security/misconfiguration-frequency-comparison.svg` | Observed issue frequency across proper, misconfigured, and AI-generated sources. |
| `security/ai-failure-rates.svg` | Model-level AI failure rates as baseline context. |
| `security/ai-vs-human-dominance-heatmap.svg` | Dominance map across core safety metrics: shows where AI underperforms the human baseline. |
| `security/token-lifecycle-fragility.svg` | Fragility profile at each JWT and OAuth2 lifecycle step. |

**Cluster B interpretation:** AI-generated code introduces a statistically significant severity gap relative to the human baseline across all three models. OAuth2 exhibits the widest misconfiguration propagation, with a single incorrect redirect URI triggering Spoofing, Information Disclosure, and Elevation simultaneously. JWT failures cluster in Elevation of Privilege, reflecting missing claim validation rather than broad lateral propagation. Session failures are narrow in STRIDE scope but high in individual impact when triggered. The token lifecycle fragility chart confirms that the most dangerous moments are token issuance and validation, not revocation.

---

## Cluster C — Maintainability and Cognition

These charts examine how code complexity, footprint, and structural choices correlate with misconfiguration frequency and developer error likelihood.

| Chart | Description |
|---|---|
| `maintainability/ai-sample-syntax-issues-by-model-stage.svg` | Syntax, type, and complexity issue counts by model and generation stage. **Primary evidence.** |
| `maintainability/code-footprint-deltas.svg` | Percent footprint deltas across characters, lines, functions, and cyclomatic complexity relative to baseline. **Primary evidence.** |
| `maintainability/complexity-to-misconfig-regression.svg` | Regression line from cyclomatic complexity to risk index; quantifies the complexity-risk slope. |
| `maintainability/complexity-vs-misconfig-frequency-regression.svg` | Regression of complexity against observed issue frequency across all variants. |
| `maintainability/maintainability-difficulty-index.svg` | Normalised maintainability difficulty index (0-171 scale) by authentication model. |
| `maintainability/failure-points-vs-chars.svg` | Distinct failure-point concentration against character footprint; identifies high-density failure zones. |

**Cluster C interpretation:** OAuth2 carries the highest code footprint and the steepest complexity-to-misconfiguration slope, confirming that its expressiveness comes at a direct developer-error cost. JWT has a compact footprint but a non-trivial difficulty index, reflecting how deceptively simple its API is to misuse. Session-based auth has the simplest footprint but generates the highest failure density per character when misconfigured, because its few critical control points are unforgiving. AI-generated code consistently inflates footprint metrics without a proportional gain in security outcome.

---

## Cluster D — Cross-Model Synthesis

These charts synthesise comparisons across all three models and AI providers, revealing patterns that only emerge at the comparison level.

| Chart | Description |
|---|---|
| `synthesis/correctness-vs-security-provider-scatter.svg` | Correctness-security trade-off scatter across Local, OpenAI, and Claude providers. **Primary evidence.** |
| `synthesis/correctness-security-tradeoff.svg` | Trade-off view with request latency encoded as bubble size; identifies the Pareto-efficient model. |
| `synthesis/cross-provider-overlap-venn.svg` | Shared versus unique failure categories across AI providers; quantifies provider-specific blind spots. |
| `synthesis/provider-bias-analysis.svg` | Failure fingerprint heatmap by provider arm; reveals systematic provider tendencies. |
| `synthesis/ai-determinism-variance.svg` | Failure-rate variability across provider arms and prompt modes; measures AI output stability. |
| `synthesis/error-diversity-entropy.svg` | Shannon entropy of failure category diversity by arm; higher entropy means less predictable failures. |
| `synthesis/misconfiguration-clustering-kmeans.svg` | K-means clusters of misconfiguration patterns; reveals natural groupings in the failure space. |
| `synthesis/calibration-and-agreement-controls.svg` | False-confidence calibration and independent checker agreement; methodology control chart. |

**Cluster D interpretation:** No single AI provider dominates cleanly across both correctness and security dimensions. OpenAI shows a slight correctness advantage under the neutral prompt but loses ground on security-critical control points when compared to the security-guided prompt variant. Claude shows more consistent security behaviour across prompt modes but at the cost of higher variance in correctness. The overlap Venn confirms that roughly 60% of failure categories are shared across providers, meaning the failure modes are fundamentally architectural rather than model-specific.

---

*For full derivation details and sensitivity analysis, see docs/generated/FAILURE_PROPAGATION_ANALYSIS.md, docs/generated/COGNITIVE_LOAD_INDEX.md, and docs/generated/CROSS_REFERENCE_SYNTHESIS.md.*

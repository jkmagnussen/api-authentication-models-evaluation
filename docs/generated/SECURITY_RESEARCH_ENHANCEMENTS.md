# Security Research Enhancements

Generated: 2026-07-21

This document maps the dissertation enhancement plan to implemented evidence outputs.

## 1) Security Severity Classification Layer

Status: Implemented.

- Severity labels are assigned per misconfiguration in `docs/generated/MISCONFIGURATION_IMPACT_MATRIX.md`.
- Classes used: Critical, High, Medium.
- Severity distribution chart: `docs/charts/security-severity-distribution.svg`.

## 2) Exploitability Score (0-10)

Status: Implemented.

- Existing exploitability scores (1-5) are transformed to a 0-10 scale in chart analytics.
- Multi-factor risk matrix chart: `docs/charts/exploitability-heatmap.svg`.
- Dimensions shown: Severity, Exploitability, Detectability, Remediation Ease.

## 3) Performance Metrics

Status: Implemented (response-time + throughput).

- Baseline vs attack metrics are generated in `docs/performance-results/statistical-summary.csv`.
- Narrative analysis: `docs/performance-results/analysis.md`.
- Visual: `docs/charts/performance-comparison.svg`.

Note: CPU and memory collection is not yet instrumented.

## 4) Maintainability Metrics

Status: Implemented (core), partially extended.

- Metrics already used: cyclomatic complexity, Halstead, maintainability index.
- Summary outputs: `docs/generated/CODE_FOOTPRINT_SUMMARY.md`, `docs/generated/code-footprint-summary.json`.
- Visuals: `docs/charts/complexity-comparison.svg`, `docs/charts/severity-vs-complexity.svg`.

Not yet implemented in pipeline: comment density, function length distribution, nesting depth, dependency counts.

## 5) Human vs AI Comparison Section

Status: Implemented.

- Human baseline and misconfiguration evidence: variant and comparative generated reports.
- AI evidence: `docs/generated/AI_EVALUATION_SUMMARY.md`, `docs/generated/AI_FAILURE_TAXONOMY.md`.
- Integrated risk/performance narrative: `docs/generated/SECURITY_PERFORMANCE_TRADEOFF.md`.

## 6) Misconfiguration Frequency in AI

Status: Implemented.

- AI failure taxonomy: `docs/generated/AI_FAILURE_TAXONOMY.md`.
- Additional frequency visual by control type and model: `docs/charts/ai-control-failure-frequency.svg`.

## 7) Security Regression Curve

Status: Implemented.

- Visual output: `docs/charts/security-regression-curve.svg`.
- Shows baseline -> misconfigured -> AI-generated security trend using normalized heuristic scores.

## 8) Model Difficulty Index

Status: Implemented.

- Difficulty index derived from baseline complexity.
- Correlation visual with AI failure rates: `docs/charts/model-difficulty-vs-ai-failure.svg`.

## 9) Security Recommendations Chapter

Status: Ready to author from generated evidence.

Suggested source artifacts:
- `docs/generated/MODEL_RISK_SUMMARY.md`
- `docs/generated/AI_FAILURE_TAXONOMY.md`
- `docs/generated/SECURITY_PERFORMANCE_TRADEOFF.md`
- `docs/charts/README.md`

## 10) Threat Model Mapping (STRIDE / OWASP)

Status: Partially present, recommended next.

- Current reports already express exploitability and impact dimensions.
- Recommended next extension: add explicit STRIDE/OWASP tags per misconfiguration in report generation.

## Chart Catalog

All chart outputs and intended interpretation are listed in:

- `docs/charts/README.md`

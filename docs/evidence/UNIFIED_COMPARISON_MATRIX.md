# Unified Comparison Matrix

This matrix combines the secure baseline, misconfiguration evidence, and AI-generated sample evaluation into one dissertation-facing view.

| Category | Item | Evidence / Metric Source | Interpretation |
|---|---|---|---|
| Secure baseline | Baseline security tests | `docs/evidence/TEST_EVIDENCE_MATRIX.md` | Establishes that the intended secure implementation resists the documented attacks and passes unit, integration, and performance checks. |
| Misconfiguration evidence | Variant exploit proofs | `docs/generated/VARIANT_DIFFERENTIAL_REPORT.md`, `docs/generated/VARIANT_FOCUSED_SUMMARY.md`, `docs/evidence/DISSERTATION_EVALUATION_TABLE.md` | Shows that small targeted configuration changes produce concrete security regressions under controlled conditions. |
| AI-generated evidence | AI sample complexity and automated checks | `docs/generated/AI_EVALUATION_SUMMARY.md`, `ai-generated/results/ai-samples-summary.csv` | Demonstrates variation in generated code quality, complexity, and security completeness across prompt-derived samples. |
| Code footprint methodology | Scoped size/complexity counts | `docs/generated/CODE_FOOTPRINT_SUMMARY.md` | Clarifies what code was counted for baseline, misconfigured, and AI-generated implementations, and what infrastructure was intentionally excluded. |

## Recommended Citation Order in Dissertation

1. Use `TEST_EVIDENCE_MATRIX.md` to justify baseline correctness and attack coverage.
2. Use `DISSERTATION_EVALUATION_TABLE.md` and `VARIANT_FOCUSED_SUMMARY.md` to show that each misconfiguration creates a measurable security regression.
3. Use `AI_EVALUATION_SUMMARY.md` and `ai-samples-summary.csv` to discuss AI-generated code variability and failure patterns.
4. Use `CODE_FOOTPRINT_SUMMARY.md` to explain how size and complexity counts were scoped and why database/bootstrap files were excluded.

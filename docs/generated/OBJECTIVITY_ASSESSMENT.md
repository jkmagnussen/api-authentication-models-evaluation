# Objectivity Assessment

Generated: 2026-07-24T18:13:35.146Z
Regenerate: npm run objective:report

This report documents fairness controls and measurable bias checks for examiner-facing methodological transparency.

## Built-In Controls

- Common harness: all models are evaluated through the same baseline, variant, and AI analysis pipelines.
- Balanced AI design intent: provider x prompt-condition matrix (OpenAI/Claude x neutral/security-guided).
- Blinded first-pass interpretation: provider-condition decomposition can be reviewed through an Arm A-D masked report before unblinding.
- Reproducibility controls: generated artifacts are validated by docs checks and drift checks.
- Stability controls: run-to-run arm variance is tracked in AI_STABILITY_REPORT.md using archived matrix snapshots.
- Statistical grounding for performance: effect size, confidence intervals, and Welch significance output.
- Pre-registration control: confirmatory endpoints and corrections are defined in docs/evidence/PRE_REGISTERED_ANALYSIS_PLAN.md.

## AI Matrix Policy Compliance

- Coverage status: Complete (4/4 arms completed).
- Headline policy: Compliant

## AI Matrix Coverage

| Provider | Prompt Condition | Arm Present | OAUTH n | JWT n | SESSIONS n | OVERALL n |
|---|---|---|---:|---:|---:|---:|
| OPENAI | neutral | Yes | 30 | 30 | 30 | 90 |
| OPENAI | security-guided | Yes | 30 | 30 | 30 | 90 |
| CLAUDE | neutral | Yes | 30 | 30 | 30 | 90 |
| CLAUDE | security-guided | Yes | 30 | 30 | 30 | 90 |

## AI Failure Rates With 95% Wilson Intervals

| Provider | Prompt Condition | Failed / Total | Failure % | 95% CI |
|---|---|---:|---:|---|
| OPENAI | neutral | 44 / 90 | 48.90% | [38.82, 59.05]% |
| OPENAI | security-guided | 34 / 90 | 37.80% | [28.46, 48.10]% |
| CLAUDE | neutral | 44 / 90 | 48.90% | [38.82, 59.05]% |
| CLAUDE | security-guided | 35 / 90 | 38.90% | [29.47, 49.22]% |

## AI Arm Pairwise Significance (Holm-Bonferroni Corrected)

| Arm A | Arm B | Raw p-value | Holm-adjusted p | Significant @ 0.05 | Note |
|---|---|---:|---:|---|---|
| openai/neutral | openai/security-guided | 0.1325 | 0.7953 | No | Two-proportion z-test on failure rate |
| openai/neutral | claude/neutral | 1.0000 | 1.0000 | No | Two-proportion z-test on failure rate |
| openai/neutral | claude/security-guided | 0.1764 | 0.7953 | No | Two-proportion z-test on failure rate |
| openai/security-guided | claude/neutral | 0.1325 | 0.7953 | No | Two-proportion z-test on failure rate |
| openai/security-guided | claude/security-guided | 0.8782 | 1.0000 | No | Two-proportion z-test on failure rate |
| claude/neutral | claude/security-guided | 0.1764 | 0.7953 | No | Two-proportion z-test on failure rate |

## Sample Balance Check

| Model | Min Arm n | Max Arm n | Spread | Assessment |
|---|---:|---:|---:|---|
| OAUTH | 30 | 30 | 0 | Balanced |
| JWT | 30 | 30 | 0 | Balanced |
| SESSIONS | 30 | 30 | 0 | Balanced |

## Independent Checker Agreement

- Control-set agreement (Cohen's kappa): 1.000
- Generated-sample agreement (Cohen's kappa): 0.635
- Generated-sample raw agreement: 81.11%
- Generated-sample disagreements: 17

## Residual Bias Risks

- AI checks remain heuristic and may not prove runtime semantic correctness.
- Fixed impact profiles in comparative reports include researcher judgement; keep this explicit in narrative.
- Severity pairwise p-values in comparative reports are exploratory flags, not confirmatory inference.
- API-provider stochasticity can shift outputs over time; preserve run timestamps and arm completeness when comparing cohorts.

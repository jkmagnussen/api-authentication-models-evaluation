# Objectivity Assessment

Generated: 2026-07-23T03:48:52.125Z
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
| OPENAI | neutral | 90 / 90 | 100.00% | [95.91, 100.00]% |
| OPENAI | security-guided | 32 / 90 | 35.60% | [26.44, 45.85]% |
| CLAUDE | neutral | 77 / 90 | 85.60% | [76.84, 91.36]% |
| CLAUDE | security-guided | 36 / 90 | 40.00% | [30.49, 50.33]% |

## AI Arm Pairwise Significance (Holm-Bonferroni Corrected)

| Arm A | Arm B | Raw p-value | Holm-adjusted p | Significant @ 0.05 | Note |
|---|---|---:|---:|---|---|
| openai/neutral | openai/security-guided | 0.0000 | 0.0000 | Yes | Two-proportion z-test on failure rate |
| openai/neutral | claude/neutral | 0.0002 | 0.0004 | Yes | Two-proportion z-test on failure rate |
| openai/neutral | claude/security-guided | 0.0000 | 0.0000 | Yes | Two-proportion z-test on failure rate |
| openai/security-guided | claude/neutral | 0.0000 | 0.0000 | Yes | Two-proportion z-test on failure rate |
| openai/security-guided | claude/security-guided | 0.5386 | 0.5386 | No | Two-proportion z-test on failure rate |
| claude/neutral | claude/security-guided | 0.0000 | 0.0000 | Yes | Two-proportion z-test on failure rate |

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

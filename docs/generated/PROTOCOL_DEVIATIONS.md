# Protocol Deviations Report

Generated: 2026-07-24T11:09:05.682Z
Regenerate: npm run objective:deviations

Unresolved Critical Deviations: 0
Unresolved Major Deviations: 0
Unresolved Minor Deviations: 0

| Deviation ID | Severity | Status | Expected | Observed | Confirmatory Impact |
|---|---|---|---|---|---|
| AI_SAMPLE_COUNT | Major | None | 30 | 30 | Changed sample count can alter variance and comparability across cohorts. |
| ALLOW_PARTIAL_MATRIX | Critical | None | false | false | Partial matrix coverage disallows confirmatory AI interpretation. |
| POWER_ANALYSIS_SEAL | Major | None | sealed prospective power analysis rationale | sealed | Unsealed power rationale weakens the prospective sample-size justification. |
| REVIEWER_SELECTION_POLICY | Major | None | reviewer selection policy present | present | Missing reviewer selection policy weakens interpretive independence guardrails. |
| MODEL_ID_OPENAI_NEUTRAL | Critical | None | gpt-4o | gpt-4o | Provider model drift can invalidate cross-run comparability for confirmatory claims. |
| MODEL_ID_OPENAI_SECURITY_GUIDED | Critical | None | gpt-4o | gpt-4o | Provider model drift can invalidate cross-run comparability for confirmatory claims. |
| MODEL_ID_CLAUDE_NEUTRAL | Critical | None | claude-haiku-4-5-20251001 | claude-haiku-4-5-20251001 | Provider model drift can invalidate cross-run comparability for confirmatory claims. |
| MODEL_ID_CLAUDE_SECURITY_GUIDED | Critical | None | claude-haiku-4-5-20251001 | claude-haiku-4-5-20251001 | Provider model drift can invalidate cross-run comparability for confirmatory claims. |

Interpretation: unresolved critical deviations must be treated as confirmatory blockers until resolved and rerun.

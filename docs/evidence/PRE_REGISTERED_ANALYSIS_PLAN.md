# Pre-Registered Analysis Plan

## Purpose

This document defines the confirmatory analysis plan used to reduce researcher degrees of freedom and improve objectivity in dissertation evidence generation.

## Primary Research Questions

1. Baseline correctness: Do secure baseline implementations satisfy functional and attack-resistance expectations?
2. Misconfiguration impact: Do targeted insecure overrides produce exploit-positive security regressions?
3. AI artifact quality: Do AI-generated artifacts omit expected controls at materially higher rates?
4. Performance impact: How do attack scenarios change latency/throughput compared with baseline behavior?

## Confirmatory Endpoints

1. Baseline correctness endpoint:
- Metric: `npm test` pass/fail over the complete suite.
- Criterion: all required baseline and attack tests pass.

2. Misconfiguration endpoint:
- Metric: focused exploit-positive variant proofs in `tests/variants/`.
- Criterion: each targeted misconfiguration has a passing focused exploit test showing expected regression behavior.

3. AI control-failure endpoint:
- Metric: per-model and per-arm failure rates in `ai-generated/results/ai-samples-failure-rates.csv`.
- Criterion: report pooled and macro rates; include uncertainty intervals and arm-level decomposition.

4. Performance endpoint:
- Metrics: avg, p95, p99, throughput deltas from `docs/performance-results/statistical-summary.csv`.
- Criterion: report deltas with 95% intervals, effect size, and Welch p-values.

## Primary Confirmatory Endpoint (Single)

1. Locked primary endpoint:
- Metric: AI overall control-failure delta between blinded arms using `OVERALL` failure percentage from `ai-generated/arms/*/results/ai-samples-failure-rates.csv`.
- Decision rule: a contrast is primary-endpoint positive only if Holm-adjusted $p \le 0.05$ and $|\Delta| \ge 3.0$ percentage points.
- Scope: all other endpoint families remain confirmatory support or exploratory context and cannot override this primary rule.

## Multiple-Testing Policy

1. Performance metric family:
- Family definition: model-level latency comparisons under attack vs baseline.
- Report: raw p-values and effect sizes.

2. AI arm-comparison family:
- Family definition: pairwise arm-level failure-rate comparisons.
- Correction: Holm-Bonferroni adjusted p-values.

3. Misconfiguration cross-model severity family:
- Family definition: pairwise model severity-score comparisons.
- Correction: Holm-Bonferroni adjusted p-values.

## Inclusion/Exclusion Rules

1. Include only generated artifacts produced by scripted pipeline commands.
2. Exclude ad-hoc manual calculations from headline claims.
3. AI matrix headline comparisons require complete provider x prompt coverage unless an explicit partial-run policy is enabled and disclosed.

## Reproducibility Requirements

1. Produce `docs/generated/RUN_MANIFEST.json` for each reporting run.
2. Preserve generated timestamps and git commit metadata.
3. Keep environment-sensitive conclusions qualified in narrative.
4. Produce a hash-locked protocol seal at `docs/generated/PROTOCOL_SEAL.json` before confirmatory cohort generation.
8. Produce a hash-locked prospective power-analysis rationale at `docs/generated/POWER_ANALYSIS_SEAL.json` before confirmatory release.

## Exploratory Analyses (Non-Confirmatory)

1. Severity-weight sensitivity analysis over alternative weighting schemes.
2. Secondary AI-checker agreement and Cohen's kappa diagnostics.
3. Provider-specific narrative decomposition beyond pooled comparison.

## Interpretation Rules

1. Confirmatory conclusions are based only on pre-specified endpoints.
2. Exploratory outputs are hypothesis-generating and must be labelled as such.
3. Any incomplete AI arm coverage must be stated in headline interpretation.
4. Blinded arm interpretation must be finalized in `docs/generated/AI_BLIND_INTERPRETATION.md` before consulting unblinded provider labels.
5. Blinded interpretation requires two reviewer sign-offs (Reviewer A and Reviewer B) before confirmatory release.
6. If Reviewer A and Reviewer B disagree, a third tie-break reviewer decision is required before confirmatory release.
7. Reviewer independence and COI disclosures must be recorded for both reviewers before confirmatory release.
8. Reviewer A and Reviewer B must be distinct reviewers selected under a simple independent-review rule; the tie-break reviewer must also be distinct from both reviewers.

## Decision Thresholds

1. Baseline correctness threshold:
- Confirmatory pass requires full `npm test` pass.

2. Misconfiguration threshold:
- Confirmatory pass requires all targeted focused exploit tests to pass.

3. AI matrix coverage threshold:
- Confirmatory AI conclusions require complete provider x prompt-condition coverage.
- Required arms are the configured matrix in `ai-generated/arms/run-summary.json`.

4. AI sample-balance threshold:
- Model-level arm spread must be 0 (balanced sample counts per arm for OAUTH/JWT/SESSIONS).

5. AI stability threshold:
- Use `docs/generated/AI_STABILITY_REPORT.md`.
- Default stability interpretation requires at least 2 cohorts per arm and arm spread not exceeding 10 percentage points.
- If these thresholds are not met, AI cross-run claims are exploratory.

6. Multiplicity threshold:
- Pairwise arm comparisons use Holm-Bonferroni adjusted p-values.
- Significance is declared only when adjusted $p \le 0.05$.

7. Practical effect threshold:
- Primary AI arm contrasts require minimum practical effect size of $|\Delta| \ge 3.0$ percentage points.
- Contrasts below this threshold are reported as non-material even if statistically significant.

8. Repeated-run power threshold:
- Each completed arm must have at least 3 historical completed cohorts in `ai-generated/arms/history`.
- If any completed arm has fewer than 3 cohorts, confirmatory AI contrast claims are disallowed.

9. Model/version drift threshold:
- Each completed arm must retain a single provider model identifier across cohort history.
- If an arm has multiple provider model identifiers across completed cohorts, confirmatory AI contrast claims are disallowed.

10. Frozen analysis window threshold:
- Confirmatory release requires `docs/generated/ANALYSIS_WINDOW.json`.
- If newer cohort snapshots exist after the frozen timestamp/reference, confirmatory interpretation is disallowed until the lock is explicitly refreshed and reports are regenerated.

11. Holdout seal threshold:
- Confirmatory release requires a hash-locked holdout definition at `docs/generated/HOLDOUT_SEAL.json` tied to `docs/evidence/HOLDOUT_SET.md`.
- If the holdout definition changes, resealing is required and the change must be documented as a protocol deviation.

12. Sentinel control threshold:
- Confirmatory release requires `docs/generated/SENTINEL_CONTROLS.md` with `Sentinel Control Status: PASS`.
- Both positive and negative sentinel checks must pass in the same report.

13. Power-analysis threshold:
- Confirmatory release requires a sealed prospective power-analysis rationale at `docs/generated/POWER_ANALYSIS_SEAL.json` tied to `docs/evidence/POWER_ANALYSIS_RATIONALE.md`.
- The rationale must state the minimum cohort count and the blocking rules for under-powered or unstable runs.

14. Reviewer selection threshold:
- Confirmatory release requires a reviewer-selection policy at `docs/evidence/REVIEWER_SELECTION_POLICY.md`.
- Reviewer A and Reviewer B must be distinct and independent; the tie-break reviewer must be distinct from both.

## Incomplete-Run Handling Rules

1. If `allowPartial=true` in matrix metadata, AI evidence is exploratory by definition.
2. If any required arm fails or is skipped, headline confirmatory AI comparisons are disallowed.
3. If run manifest lacks model IDs, prompt fingerprints, generation parameters, or retry policy metadata for completed arms, confirmatory interpretation is disallowed.
4. If stability evidence is missing, cross-run robustness claims are disallowed.
5. Any deviations from this plan must be documented in generated reports as protocol deviations.
6. If leakage guardrails fail (generator prompt text overlap with evaluation corpus), confirmatory AI evidence is disallowed until prompts/tests are decoupled and rerun.
7. If `docs/generated/PROTOCOL_DEVIATIONS.md` reports unresolved critical deviations, confirmatory interpretation is disallowed.
8. If dual-reviewer sign-off fields in `docs/generated/AI_BLIND_INTERPRETATION.md` are missing or pending, confirmatory interpretation is disallowed.
9. If `docs/generated/ANALYSIS_WINDOW.json` is missing or stale relative to latest cohort history, confirmatory interpretation is disallowed.
10. If reviewer disagreement is present without completed tie-break adjudication fields, confirmatory interpretation is disallowed.
11. If `docs/generated/HOLDOUT_SEAL.json` is missing or its hash does not match `docs/evidence/HOLDOUT_SET.md`, confirmatory interpretation is disallowed.
12. If `docs/generated/SENTINEL_CONTROLS.md` does not report `Sentinel Control Status: PASS`, confirmatory interpretation is disallowed.
13. If `docs/generated/POWER_ANALYSIS_SEAL.json` is missing or does not match `docs/evidence/POWER_ANALYSIS_RATIONALE.md`, confirmatory interpretation is disallowed.
14. If `docs/evidence/REVIEWER_SELECTION_POLICY.md` is missing or reviewer names are not distinct, confirmatory interpretation is disallowed.

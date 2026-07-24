# Pre-Registered Compliance Summary

Generated: 2026-07-24T23:11:36.022Z
Regenerate: npm run objective:preregistered:report

Governance mode: EXPLORATORY
Claim class: exploratory-author-interpreted
Blind interpretation status: draft-needs-finalization

| Criterion | Status | Evidence |
|---|---|---|
| Protocol source artifact exists | PASS | docs/generated/RUN_MANIFEST.json |
| Protocol seal matches source artifact | FAIL | docs/generated/PROTOCOL_SEAL.json |
| Sensitivity-analysis source is sealed | PASS | docs/generated/SENSITIVITY_ANALYSIS.md + docs/generated/POWER_ANALYSIS_SEAL.json |
| Full AI matrix coverage for confirmatory claims | PASS | ai-generated/arms/run-summary.json (4/4) |
| Objectivity report explicitly states complete coverage | PASS | docs/generated/OBJECTIVITY_ASSESSMENT.md |
| Run environment manifest present | PASS | docs/generated/RUN_MANIFEST.json |
| Governance mode is recorded in manifest | PASS | docs/generated/RUN_MANIFEST.json methodology.governance |
| Claim class is recorded in manifest | PASS | docs/generated/RUN_MANIFEST.json methodology.governance |
| Dependency lock normalization captured | PASS | docs/generated/RUN_MANIFEST.json methodology.runNormalization |
| Blinded provider report present | PASS | docs/generated/AI_PROVIDER_PROMPT_COMPARISON_BLINDED.md |
| Blind interpretation finalized pre-unblind | FAIL | docs/generated/AI_BLIND_INTERPRETATION.md |
| Blind interpretation reviewer A sign-off present | FAIL | docs/generated/AI_BLIND_INTERPRETATION.md |
| Blind interpretation reviewer B sign-off present | FAIL | docs/generated/AI_BLIND_INTERPRETATION.md |
| Reviewer agreement/adjudication is valid | FAIL | docs/generated/AI_BLIND_INTERPRETATION.md |
| Frozen analysis window artifact present and fresh | PASS | docs/generated/ANALYSIS_WINDOW.json |
| Holdout source artifact is sealed and hash-locked | PASS | docs/generated/ANALYSIS_WINDOW.json + docs/generated/HOLDOUT_SEAL.json |
| Sentinel controls indicate expected detectability | PASS | docs/generated/SENTINEL_CONTROLS.md |
| Signed audit trail is present | PASS | docs/generated/AUDIT_TRAIL.json |
| Blinded report includes significance + practical thresholds | PASS | docs/generated/AI_PROVIDER_PROMPT_COMPARISON_BLINDED.md |
| AI stability report present | PASS | docs/generated/AI_STABILITY_REPORT.md |
| Repeated-run cohort threshold met for completed arms | PASS | ai-generated/arms/history/*.json (>= 3 per completed arm) |
| Completed arms include provider names | PASS | docs/generated/RUN_MANIFEST.json methodology.aiMatrix.armCompleteness |
| Completed arms include provider model identifiers | PASS | docs/generated/RUN_MANIFEST.json methodology.aiMatrix.armCompleteness |
| Completed arms include prompt fingerprints | PASS | docs/generated/RUN_MANIFEST.json methodology.aiMatrix.armCompleteness |
| Completed arms include generation parameters | PASS | docs/generated/RUN_MANIFEST.json methodology.aiMatrix.armCompleteness |
| Completed arms include retry policy metadata | PASS | docs/generated/RUN_MANIFEST.json methodology.aiMatrix.armCompleteness |
| AI failure taxonomy report present (for blinded adjudication/kappa) | PASS | docs/generated/AI_FAILURE_TAXONOMY.md |
| Protocol deviations report present | PASS | docs/generated/PROTOCOL_DEVIATIONS.md |
| Protocol deviations unresolved critical count is zero | PASS | docs/generated/PROTOCOL_DEVIATIONS.md |

Interpretation: FAIL on any confirmatory criterion means evidence should be treated as exploratory until rerun conditions are satisfied.

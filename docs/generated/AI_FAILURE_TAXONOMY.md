# AI Failure Taxonomy

Generated: 2026-07-24T18:13:33.163Z
Regenerate: npm run compare:reports

This taxonomy groups AI sample security failures by control type to show where generated artifacts struggled most.

| Model | Control Category | Count | Example Triggers |
|---|---|---:|---|
| OAUTH | Other security control | 30 | redirect validation present; no permissive admin default |
| OAUTH | OAuth scope control | 15 | scope validation present |
| JWT | JWT claim validation | 6 | audience validation present; issuer validation present |
| SESSIONS | Session lifecycle hardening | 3 | session regeneration present |
| SESSIONS | Session invalidation | 2 | logout invalidation present |

## Difficulty-Stratified Failure Counts

| Model | Difficulty Tier | Count |
|---|---|---:|
| OAUTH | Medium | 30 |
| OAUTH | Easy | 15 |
| JWT | Medium | 6 |
| SESSIONS | Hard | 5 |

## Blinded Dual-Rater Adjudication (Sample-Level)

- Adjudicated failure tags (sample-level units): 56
- Cohen's kappa (Rater A vs Rater B): 1.000
- Rater blinding protocol: labels are generated from two independent mapping functions before any provider-specific decomposition is reviewed.
- Interpretation: Kappa of 1.000 indicates near-perfect agreement between the two independent mapping functions. Note: because both raters are deterministic functions rather than human raters, this reflects categorical consistency of the labelling scheme, not human inter-rater reliability.

Interpretation: Higher counts indicate repeated weak spots in generated samples and are useful for prompt-hardening or stricter automated guardrails.

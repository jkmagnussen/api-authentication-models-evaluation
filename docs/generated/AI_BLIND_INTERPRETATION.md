# AI Blind Interpretation

Generated: 2026-07-24T11:08:59.805Z
Regenerate: npm run objective:blind:interpretation

Status: FINALIZED_PRE_UNBLIND
Blinded report SHA256: de4c1afcb01932dcebcf2e033434d412d4f6288119f9f75e98fd55bc8149c1d1

## Pre-Unblind Interpretation

1. Primary contrast identified (Arm X vs Arm Y):
- Primary contrast: Arms B and D (lower-failure group, ~38–39% overall) vs Arms A and C (higher-failure group, ~49% overall).
- Arms B and D differ from Arms A and C by approximately 10–11 percentage points in overall failure rate.
- OAuth failure rate is uniformly 90% across all four arms, indicating a structural ceiling effect for that control domain that is not arm-discriminating. Arm differences are concentrated in JWT (Arms A/C: 26.7%; Arms B/D: 10%) and Sessions (Arms A/C: 30%; Arms B: 16.7%; Arms D: 13.3%).
- The consistent within-condition pattern (Arms A and C similar; Arms B and D similar) suggests the lower-failure pair reflects a systematic difference rather than random variation.

2. Decision-rule statement:
- Practical effect threshold (|delta| >= 3pp): MET for 4 of 6 pairwise contrasts (A vs B: 10pp; A vs D: 11.1pp; B vs C: 10pp; C vs D: 11.1pp).
- Holm-adjusted statistical significance (p <= 0.05): NOT MET for any contrast (all Holm-adjusted p >= 0.79).
- Conclusion: No contrast meets both thresholds. None of the six pairwise arm contrasts are confirmatory-eligible. All findings are exploratory only.

3. Caveats before unblinding:
- Governance mode is EXPLORATORY; this interpretation does not support confirmatory inference regardless of which arms are unblinded.
- No independent human reviewer is available for this solo dissertation; both reviewer sign-offs represent the same author's self-assessment. The dual-reviewer policy (REVIEWER_SELECTION_POLICY.md) cannot be satisfied under solo authorship. This is an explicit stated limitation; findings are single-author exploratory only.
- Deterministic rater functions were used for adjudication. Cohen's kappa of 1.000 reflects categorical scheme consistency, not human inter-rater reliability.
- Small per-arm cohort (n=90, ~30 per model) limits statistical power. Observed 10–11pp deltas are practically meaningful but underpowered for significance at this sample size.
- OAuth uniformity (90% failure across all arms) may indicate those controls are structurally difficult regardless of generation condition and should not be interpreted as arm-specific weakness.

## Reviewer Sign-off

Reviewer A: Author (sole researcher — no independent reviewer available; solo dissertation limitation)
Reviewer A Signed At: 2026-07-24
Reviewer A Independence: NOT INDEPENDENT — single-author study; no distinct reviewer engaged
Reviewer A COI Disclosure: Author is the sole designer, implementer, and analyst of this study
Reviewer B: NOT APPLICABLE — solo dissertation; dual-reviewer policy cannot be satisfied; see REVIEWER_SELECTION_POLICY.md
Reviewer B Signed At: NOT APPLICABLE
Reviewer B Independence: NOT APPLICABLE
Reviewer B COI Disclosure: NOT APPLICABLE
Reviewer Selection Policy: Dual-reviewer requirement noted and unmet; findings remain exploratory-only as a consequence.

## Adjudication

Reviewer Agreement: NOT APPLICABLE — single reviewer
Tie-break Reviewer: NOT APPLICABLE
Tie-break Decision: NOT APPLICABLE
Tie-break Signed At: NOT APPLICABLE

## Finalization

- Status set to FINALIZED_PRE_UNBLIND on 2026-07-24 by sole author.
- Blinded report SHA256 verified against current blinded report before finalization.
- All findings are exploratory-only. Governance mode EXPLORATORY; confirmatory criteria cannot be met under solo authorship with deterministic raters.

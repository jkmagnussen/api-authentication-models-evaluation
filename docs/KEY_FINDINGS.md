# Key Findings

This document summarises the highest-level outcomes of the repository evidence.

## Baseline Secure Implementation

- The secure baseline passes shared unit, integration, and attack-oriented tests.
- Coverage is strong enough to support claims of broad behavioral exercise.
- The baseline therefore serves as a defensible reference implementation for comparison.

## Misconfiguration Variants

- Each misconfiguration produces a focused, security-relevant regression.
- The exploit-proof commands show that small, targeted configuration changes can directly undermine expected controls.
- This supports the claim that implementation correctness depends not just on model choice, but on secure configuration discipline.

## AI-Generated Artifacts

- AI-generated samples vary in both structural complexity and security completeness.
- Some samples satisfy the local screening criteria, while others omit expected controls or encode insecure patterns.
- The AI-generated outputs are therefore best interpreted as variable-quality artifacts rather than interchangeable production-ready implementations.

## Overall Interpretation

- The curated secure baseline is more consistent than both targeted misconfigurations and AI-generated samples.
- Misconfigurations demonstrate how controlled regressions break otherwise sound models.
- AI-generated outputs demonstrate that code generation may produce artifacts with acceptable complexity but incomplete security properties.

## Cross-Metric Synthesis (Security, Performance, Maintainability, AI)

1. **Security posture and performance are not aligned by default**
- The model with lower observed attack-overhead in a run set is not automatically the safer model.
- Severity-ranked misconfiguration outcomes and exploit-positive tests carry the stronger security signal.

2. **Configuration discipline dominates model branding**
- Sessions, JWT, and OAuth all show high sensitivity to narrow configuration faults.
- This indicates that secure operation depends more on hardening rigor and verification controls than on nominal protocol selection.

3. **AI artifact maintainability signals do not guarantee security completeness**
- Structural/code-footprint quality can appear reasonable while control omissions still occur.
- AI outputs should therefore be treated as review-required drafts, not deployment-ready substitutions.

4. **Best-supported dissertation claim**
- The strongest claim supported by this evidence set is that a controlled baseline plus explicit variant testing and reproducibility controls provides more defensible security conclusions than single-metric or model-label comparisons.

## Evidence Linkage For Synthesis

- Security vs performance tradeoff summary: `docs/generated/SECURITY_PERFORMANCE_TRADEOFF.md`
- Misconfiguration impact and exploit interpretation: `docs/generated/MISCONFIGURATION_IMPACT_MATRIX.md` and `docs/evidence/DISSERTATION_EVALUATION_TABLE.md`
- AI artifact quality outcomes: `docs/generated/AI_EVALUATION_SUMMARY.md` and `docs/generated/AI_FAILURE_TAXONOMY.md`
- Maintainability/footprint context: `docs/generated/CODE_FOOTPRINT_SUMMARY.md`

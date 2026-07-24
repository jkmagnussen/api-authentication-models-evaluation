# Key Findings

High-level outcomes from the repository evidence.

## Baseline Secure Implementation

- The secure baseline passes unit, integration, and attack-oriented tests.
- Coverage supports broad behavioral exercise claims.
- The baseline is a defensible reference for comparison.

## Misconfiguration Variants

- Each misconfiguration produces a focused, security-relevant regression.
- Small configuration changes can directly undermine expected controls.
- Secure operation depends on configuration discipline, not only model choice.

## AI-Generated Artifacts

- Samples vary in structural complexity and security completeness.
- Some pass local screening while others omit controls or include insecure patterns.
- Treat outputs as variable-quality artifacts, not production-ready replacements.

## Overall Interpretation

- The curated secure baseline is more consistent than misconfigured and AI-generated variants.
- Misconfigurations show how targeted regressions break otherwise sound models.
- AI-generated outputs can look structurally acceptable while still incomplete on security controls.

## Cross-Metric Synthesis (Security, Performance, Maintainability, AI)

1. **Security posture and performance are not aligned by default**
- Lower observed attack overhead does not automatically mean stronger security.
- Severity-ranked misconfiguration outcomes and exploit-positive tests are stronger security signals.

2. **Configuration discipline dominates model branding**
- Sessions, JWT, and OAuth all show high sensitivity to narrow configuration faults.
- Hardening rigor and verification controls matter more than nominal protocol choice.

3. **AI artifact maintainability signals do not guarantee security completeness**
- Structural/code-footprint quality can look reasonable while control omissions remain.
- Treat AI outputs as review-required drafts.

4. **Best-supported dissertation claim**
- A controlled baseline, explicit variant testing, and reproducibility controls provide more defensible conclusions than single-metric or model-label comparisons.

## Evidence Linkage For Synthesis

- Security vs performance tradeoff summary: `docs/generated/SECURITY_PERFORMANCE_TRADEOFF.md`
- Misconfiguration impact and exploit interpretation: `docs/generated/MISCONFIGURATION_IMPACT_MATRIX.md` and `docs/evidence/DISSERTATION_EVALUATION_TABLE.md`
- Failure propagation and cross-reference synthesis: `docs/generated/FAILURE_PROPAGATION_ANALYSIS.md` and `docs/generated/CROSS_REFERENCE_SYNTHESIS.md`
- Developer-cognition framing: `docs/generated/COGNITIVE_LOAD_INDEX.md`
- AI artifact quality outcomes: `docs/generated/AI_EVALUATION_SUMMARY.md` and `docs/generated/AI_FAILURE_TAXONOMY.md`
- Maintainability/footprint context: `docs/generated/CODE_FOOTPRINT_SUMMARY.md`

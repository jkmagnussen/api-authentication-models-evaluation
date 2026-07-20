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

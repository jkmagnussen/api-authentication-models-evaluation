# Threats To Validity

## Internal Validity

- Misconfiguration variants are deliberate and controlled, which improves isolation of causal effects.
- However, they still represent selected weaknesses rather than the full universe of implementation mistakes.

## Construct Validity

- Baseline and misconfiguration claims are supported by executable behavioral tests.
- AI-generated sample assessment is based on artifact-level heuristic screening rather than semantic runtime substitution.
- This means the AI evidence is best interpreted as structural and security-pattern evidence, not full behavioral equivalence evidence.

## External Validity

- Results are grounded in one backend architecture, one language stack, and one repository structure.
- Generalisation to other frameworks, languages, or deployment environments should therefore be made cautiously.

## Statistical Conclusion Validity

- Performance outputs depend on repeated execution, environment stability, and host configuration.
- Single-run metrics are informative, but repeated-run analysis gives stronger confidence.

## Prompt And Generation Validity

- The AI-generated workflow uses fixed prompts for fairness across samples.
- In the current local setup, generation is deterministic rather than provider-backed and stochastic.
- This improves reproducibility but reduces the ability to study prompt-variance effects.

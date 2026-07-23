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
- The primary workflow is provider-backed (OpenAI and Claude) under neutral and security-guided prompt conditions.
- Provider outputs are stochastic and credential-dependent; complete arm coverage is required for full-matrix comparisons.

## Observed Negative Findings And Failure Modes

- **Heuristic AI checks are fallible by design**: pattern-based detectors can over-flag or miss semantically equivalent constructs.
- **Mutation-testing residual risk remains**: surviving mutants indicate that some behavioral regions remain weakly constrained by the current test suite.
- **Environment sensitivity is non-trivial**: repeated performance runs reduce noise but cannot eliminate host/runtime/database variability.
- **Variant representativeness is bounded**: selected misconfigurations are intentionally narrow probes and do not exhaust all plausible real-world failure modes.
- **Provider drift can alter comparative baselines**: model updates outside repository control can move outcome distributions between runs.

These findings do not invalidate the study design, but they do constrain claim strength. The resulting conclusions are therefore framed as reproducible evidence within this controlled setup, not universal dominance claims.

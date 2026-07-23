# Methodology And Limitations

## Evaluation Methodology

This project evaluates three authentication models under three complementary lenses:

1. **Secure baseline assessment**
- The implementations in `src/` are treated as the intended secure baseline.
- They are assessed with executable unit, integration, attack, and performance tests.

2. **Misconfiguration assessment**
- The implementations in `misconfigurations/` are not standalone rewrites.
- Each variant is a targeted override applied to the secure baseline.
- These variants are assessed behaviorally using focused exploit tests that demonstrate a changed security outcome.

3. **AI-generated artifact assessment**
- The samples in `ai-generated/` are treated as independent generated artifacts.
- They are not runtime-swapped into the baseline application by default.
- They are evaluated for complexity, maintainability, omissions, and insecure patterns using automated artifact-level screening.
- Failure taxonomy interpretation includes sample-level dual-rater blinded adjudication proxies and Cohen's kappa diagnostics to reduce single-rater framing bias.

## Original Contribution Of This Artefact

This project's primary contribution is methodological rather than algorithmic novelty. The contribution is a controlled, reproducible evaluation design that keeps implementation context stable while comparing three authentication families across four evidence channels:

1. **Secure baseline behavior** under executable unit, integration, attack, and performance tests.
2. **Targeted misconfiguration deltas** that modify only specific security-relevant decisions while preserving shared runtime architecture.
3. **AI-generated artifact analysis** that is intentionally kept separate from runtime-swapped behavioral claims to avoid confounding structural quality with execution completeness.
4. **Submission-safe reproducibility controls** using an offline freeze lock and verification workflow to preserve generated-evidence integrity.

The practical novelty is the unified protocol that allows like-for-like security, performance, and maintainability comparison while making explicit where claims are behavioral versus artifact-structural.

## Measurement Scope

- Code footprint metrics are **slice-based**, not full dependency-closure counts.
- Baseline counts include only the authentication slice under evaluation.
- Shared infrastructure such as Prisma schema, migrations, `src/db.ts`, and unrelated bootstrap code is intentionally excluded unless it belongs directly to the evaluated slice.
- Misconfiguration footprint counts represent the secure slice plus the override/configuration delta required to activate the misconfiguration.
- AI-generated footprint counts cover the contents of the generated sample files only.

## Why AI Samples Are Not Runtime-Swapped By Default

- Misconfigurations are designed to preserve the same abstraction boundary as the secure baseline.
- AI-generated samples are often incomplete, structurally different, or non-interchangeable.
- Forcing them into the runtime would blur the distinction between artifact quality and executable behavior.
- Treating them as artifacts produces a cleaner and more defensible comparison.

## Transferability And Generalisation Boundaries

### Likely portable

- The baseline-vs-variant experimental pattern where misconfigurations are introduced as narrow deltas.
- The claim discipline separating behavioral evidence (runtime tests) from structural evidence (artifact screening).
- The freeze-lock and verification approach for generated-evidence reproducibility.

### Conditionally portable

- Relative performance comparisons, if repeated-run controls and comparable hardware conditions are preserved.
- AI artifact quality comparisons, if prompt structure, sampling strategy, and adjudication protocol are preserved.

### Context-specific

- Absolute latency values and throughput under load.
- Exact exploit outcomes tied to this stack's middleware, token handling, cookie/session configuration, and route structure.
- Any metric affected by provider-side model drift or temporary API behavior changes.

## Limitations

1. **AI heuristics are not semantic proof**
- The AI sample test runners use pattern-based checks.
- They can produce false positives and false negatives.

2. **Archived legacy AI artifacts are not part of the primary AI comparison**
- Earlier local/template AI artifacts are retained only as historical internal material.
- The primary dissertation AI comparison uses external provider outputs under neutral and security-guided prompt conditions.

3. **Performance results are environment-sensitive**
- Latency and throughput are affected by host machine, background load, Node.js version, and database configuration.
- Variance under load is reported from repeated empirical runs written to `docs/performance-results/runs/` and summarized using model-level distribution statistics.
- Repeated performance runs should be reported for stronger statistical confidence.

4. **Misconfiguration counts are effective runtime counts**
- Misconfiguration footprint results intentionally include baseline slice code because the variant is an override on top of the baseline, not an independent implementation.

5. **Adjudication and leakage controls are still operational controls, not full human-review guarantees**
- Blinded dual-rater taxonomy adjudication currently uses deterministic independent mapping functions rather than two human raters.
- Leakage checks are string-overlap guardrails and cannot prove the absence of all latent conceptual overlap.

## Recommended Framing In The Dissertation

- Use the secure baseline to establish expected behavior.
- Use misconfigurations to demonstrate how targeted implementation weaknesses produce measurable regressions.
- Use AI-generated artifacts to discuss whether generated code tends to omit or weaken expected controls, and how its structural complexity compares with the curated baseline.

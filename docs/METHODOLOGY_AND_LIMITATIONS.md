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

## Limitations

1. **AI heuristics are not semantic proof**
- The AI sample test runners use pattern-based checks.
- They can produce false positives and false negatives.

2. **Local AI generation is deterministic**
- In the current repository setup, generated samples are fixed local artifacts.
- This limits prompt-variance analysis unless the generation pipeline is later connected to an external nondeterministic model provider.

3. **Performance results are environment-sensitive**
- Latency and throughput are affected by host machine, background load, Node.js version, and database configuration.
- Repeated performance runs should be reported for stronger statistical confidence.

4. **Misconfiguration counts are effective runtime counts**
- Misconfiguration footprint results intentionally include baseline slice code because the variant is an override on top of the baseline, not an independent implementation.

## Recommended Framing In The Dissertation

- Use the secure baseline to establish expected behavior.
- Use misconfigurations to demonstrate how targeted implementation weaknesses produce measurable regressions.
- Use AI-generated artifacts to discuss whether generated code tends to omit or weaken expected controls, and how its structural complexity compares with the curated baseline.

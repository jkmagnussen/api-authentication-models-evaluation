# Dissertation Template Guide

This guide explains how to use the **Final Dissertation - Criteria for Assessment** template. The template is a marking rubric, not a chapter-by-chapter writing template. Use it as a checklist while writing, then use it again when editing the final dissertation.

The central rule is simple: every important claim should be supported by a clear link between the research question, the literature, the method, the evidence, and the conclusion.

## Project-Specific Study Design

The specification and design report defines three research questions:

1. How do Sessions, JWT, and OAuth 2.0 with PKCE compare under normal and adversarial conditions?
2. Is AI-generated authentication code equivalent to human-authored code at predefined security control points?
3. Does security-guided prompting reduce AI-generated security failures?

The project evaluates the three authentication models in one shared API environment. Its evidence consists of implementation and security testing, controlled misconfiguration testing, performance benchmarking, and analysis of AI-generated implementations against a human-authored baseline.

### Legacy AI Sample Accounting (Provenance Unverified)

The archived provider-prompt CSVs contain **360 file-level entries**, not 90:

| Provider and prompt arm | Samples |
| ----------------------- | ------: |
| OpenAI neutral          |      90 |
| OpenAI security-guided  |      90 |
| Claude neutral          |      90 |
| Claude security-guided  |      90 |
| **Total**               | **360** |

Each arm's CSV lists 30 OAuth, 30 JWT, and 30 Sessions entries. However, the corresponding arm metadata records `sampleCount: 5`, and the archived cohort workflow reused shared output directories. The files therefore do not verify 360 independent generation requests. Treat 90 per arm and 360 overall as legacy file-level denominators only; do not use the old stability snapshots or pairwise inferential results as confirmatory evidence.

The stored arm results report 157 failures among those 360 file-level entries:

| Model            | Pooled samples | Pooled failures | Pooled failure rate |
| ---------------- | -------------: | --------------: | ------------------: |
| OAuth 2.0 + PKCE |            120 |             108 |               90.0% |
| JWT              |            120 |              22 |               18.3% |
| Sessions         |            120 |              27 |               22.5% |
| **Overall**      |        **360** |         **157** |           **43.6%** |

The figures 90.0% for OAuth, 10.0% for JWT, and 13.3% for Sessions describe the **OpenAI security-guided arm only**. They must not be presented as pooled results for all four arms. A clean replacement study should use isolated cohort directories, verify exact counts and model identifiers, and retain per-output generation provenance before its denominators are treated as independent samples.

## 1. Recommended Dissertation Structure

Use the following structure unless your approved proposal or supervisor requires a different one:

1. **Title page and abstract**
2. **Contents, lists of figures/tables, and abbreviations**
3. **Introduction**
   - Context and problem
   - Research gap or motivation
   - Research question(s)
   - Aim and objectives
   - Contribution and scope
   - Dissertation structure
4. **Literature review**
5. **Methodology**
6. **Requirements, specification, and design**
7. **Implementation**
8. **Results and evaluation**
9. **Discussion**
10. **Conclusion and recommendations**
11. **References**
12. **Appendices**

The headings may differ from the rubric headings, but the assessed content must still be easy to find.

## 2. How to Use the Rubric

Before drafting each chapter, write down:

- Which research question or objective this chapter addresses.
- Which sources justify the decisions made in the chapter.
- What evidence the reader should take from the chapter.
- Which limitation or alternative explanation must be acknowledged.
- Where the chapter's conclusions are tested later in the dissertation.

Avoid writing to the 80% column by repeating words such as _outstanding_ or _innovative_. The higher bands are earned by precise reasoning, critical comparison, reliable evidence, and well-supported interpretation.

## 3. Section-by-Section Writing Guide

### Section 1: Delivery

#### Organisation, format, and length

Check that:

- The dissertation follows the university template and approved formatting rules.
- Headings use a consistent hierarchy and appear in the contents page.
- Figures and tables are numbered, titled, referred to in the text, and readable.
- The word count is within the required limit and any exclusions are applied consistently.
- Appendices contain supporting material rather than essential argument.
- Page numbers, margins, spacing, captions, and headers/footers are consistent.

#### Writing style and presentation

Aim for a clear academic argument rather than a diary of development. Each section should establish its purpose, present evidence, interpret that evidence, and connect forward to the research question.

Edit for:

- Clear topic sentences and logical paragraph order.
- Consistent terminology, especially for technical concepts.
- Precise claims that distinguish fact, observation, interpretation, and recommendation.
- Correct spelling, grammar, tense, units, and notation.
- Concise prose without unexplained jargon or unsupported superlatives.

#### Referencing and appropriate citations

Use the required Harvard style consistently for both in-text citations and the reference list. Cite:

- Definitions and established theories.
- Claims about security, performance, usability, or industry practice.
- Methodological choices and evaluation criteria.
- Technologies, standards, frameworks, and prior studies.

Do not use a citation as a substitute for analysis. Explain what a source contributes, how sources agree or disagree, and why that matters to this project.

### Section 2: Objectives and Dissertation Question

#### Research plan and novelty/originality

State the research question early and make the plan visibly answer it. A useful mapping is:

| Research element | What to make explicit                                         |
| ---------------- | ------------------------------------------------------------- |
| Problem          | What is difficult, unsafe, inefficient, or poorly understood? |
| Gap              | What is missing from existing research or practice?           |
| Question         | What precise answer will the dissertation seek?               |
| Artefact         | What will be designed or implemented?                         |
| Evaluation       | What measurements or tests will determine success?            |
| Contribution     | What will readers learn that they did not know before?        |

Novelty does not require inventing a completely new technology. It may come from a new comparison, dataset, evaluation protocol, threat model, synthesis, or practical finding. State exactly what is original and avoid claiming more generality than the evidence supports.

#### Research and/or project aims and objectives

Write one broad aim and a small number of measurable objectives. Strong objectives use verbs such as _identify_, _design_, _implement_, _measure_, _compare_, _evaluate_, and _interpret_.

Each objective should have a corresponding result or conclusion. Remove objectives that are never addressed, and add a clear explanation when an objective had to change during the project.

### Section 2: Rationale and Project Plan

Explain why the project matters and why the chosen approach is appropriate. Include:

- The practical or academic problem.
- The consequences of leaving the problem unresolved.
- The proposed solution or artefact.
- The stages of work and their dependencies.
- The evaluation plan, including success criteria.
- Risks, constraints, and planned mitigations.

For the API authentication project, the rationale should distinguish authentication security from other concerns such as latency, implementation complexity, failure behaviour, and maintainability. Do not present one authentication model as universally best without defining the context and weighting of the criteria.

#### Argument linking the proposed solution to the problem

Make the chain of reasoning explicit:

> Problem -> design decision -> implemented control or feature -> test/evidence -> supported conclusion

For example, a stated threat should lead to a specific control, an attack or regression test, an observed result, and a bounded claim about protection. A list of technologies without this chain is description, not argument.

### Section 3: Literature Review

#### Quality of the literature review

Organise the review by themes or debates, not by one paragraph per source. For each theme:

1. Define the issue.
2. Compare relevant sources.
3. Identify agreement, disagreement, and limitations.
4. Explain the implication for the research question or design.

The review should establish the evaluation criteria used later. For this project, likely themes include authentication models, session security, JWT risks, OAuth 2.0 and PKCE, threat modelling, secure API design, performance evaluation, and reproducibility.

#### Quality of academic sources

Prioritise recent, peer-reviewed and authoritative sources, while retaining seminal standards or older work when it remains necessary. Useful source types include journal and conference papers, standards, official security guidance, and authoritative technical specifications.

Keep a source matrix containing:

| Source | Claim supported | Method or evidence | Limitation | Where used |
| ------ | --------------- | ------------------ | ---------- | ---------- |

This prevents a long reference list from becoming a disconnected catalogue.

### Section 4: Methodology

#### Research methodology

Name and justify the research approach. Explain:

- Why the approach fits the question.
- How the artefact will be designed and developed.
- How variables, controls, threats, and outcomes are defined.
- Why the chosen tests and metrics are valid.
- How reliability, validity, bias, repeatability, and scope are handled.
- What ethical, legal, privacy, or security issues apply.

For a software evaluation, distinguish the research method from the engineering process. Building the application is not, by itself, a methodology; the dissertation must explain how the implementation produces evidence that answers the question.

#### Implementation according to design and specification

Document the final implementation against the approved specification and design. For every material change, record:

- What changed.
- Why it changed.
- When it changed.
- What effect it had on the evaluation.

Useful evidence includes architecture diagrams, API contracts, database design, security controls, test strategy, configuration assumptions, and traceability from requirements to implementation and tests. Put large code listings in an appendix or repository and discuss the important design decisions in the main text.

#### Human participants and ethical concerns

If no human participants or human-derived data were used, state that clearly and explain why the criterion is not applicable. Do not imply ethical approval where none was required.

If participants were used, document recruitment, inclusion/exclusion criteria, consent, data handling, risks, withdrawal, anonymity, approval, and storage. These details should be consistent with the approved ethics documentation.

### Section 5: Results and Evaluation

#### Presentation, relevance, and reliability of results

Present results in a form that answers the objectives. For each experiment or evaluation:

- State the purpose and hypothesis or expectation.
- Describe the setup, inputs, controls, and sample size.
- Report raw or sufficiently detailed summary data.
- Include appropriate tables, charts, confidence intervals, or uncertainty measures.
- Separate observed results from interpretation.
- Explain failed tests, missing data, and anomalies.

For this repository, the evidence may include secure baseline tests, controlled misconfiguration variants, attack tests, performance runs, statistical summaries, reproducibility outputs, and AI-generated evaluation results. Keep these evidence strands distinct and explain how each contributes to the research question.

For the AI strand, report the sampling hierarchy explicitly: provider and prompt arm, authentication model, number of samples, detected failures, and failure rate. Distinguish static heuristic detection from runtime security verification. The AI-generated code was analysed as code under evaluation and was not deployed as a replacement for the human-authored artefact.

#### Analysis and evaluation in light of the question

Do not stop at “Model A was faster” or “Test X passed.” Interpret what the result means, under which conditions it holds, and whether it supports the objective. Compare results with the literature and discuss competing explanations.

A strong evaluation addresses:

- Security effectiveness and failure modes.
- Performance and variability.
- Operational or implementation trade-offs.
- The effect of configuration and threat assumptions.
- Reproducibility and limitations.
- The strength of evidence behind each conclusion.

The completed protocol-v7 performance benchmark contains 30 matched run blocks, with 1,000 protected-resource requests per mechanism and condition. Each test suite reuses one localhost server and keep-alive connection; baseline Bearer credentials must succeed and invalid credentials must be rejected. The Sessions attack uses an invalid value under the implemented `sessionId` cookie name, and the browser cookie lifetime is bounded by the persisted-session TTL. The blocks alternate baseline-first and attacks-first order, use no warm-up, and run on one local host. Historical, earlier-protocol, failed, and partial attempts are excluded from v7 paired inference. Attack measurements describe the cost of rejecting invalid credentials, not successful authenticated workload performance. Throughput is derived from mean request latency rather than measured under concurrent load; report it as a dependent estimate, not an independent capacity result. Identify per-run raw traces separately from the paired run-level summaries. Each block manifest fingerprints the relevant auth, schema, benchmark, and lockfile sources so the measured source version can be audited.

A separate concurrent-load extension now measures actual requests per second at 1, 10, and 50 concurrent requests after a 100-request warm-up, with 1,000 measured requests per cell. Five matched blocks are available as exploratory single-host results; they should remain separate from the v4 sequential-latency study and should not support production-capacity claims. The independent AI heuristic review packet is prepared, but no human ratings are yet available.

Use cautious language where appropriate: _within the tested configuration_, _the results suggest_, and _this study does not establish_ are often more rigorous than universal claims.

### Section 6: Conclusions and Recommendations

#### Originality of ideas, insights, and observations

State the contribution in terms of findings, not effort. Explain what the project adds to knowledge or practice, why it is useful, and how it differs from what the literature already established.

#### Analysis of project outcomes

Evaluate strengths and weaknesses interpretively. Discuss how limitations affect the conclusions, rather than listing limitations without consequences. Relevant limitations may include test scope, environment, sample size, provider or model coverage, threat assumptions, measurement noise, implementation choices, and external validity.

#### Implications and future research

Include:

- Lessons learned about the research and development process.
- Skills or judgement developed as a researcher.
- Implications for practitioners and the discipline.
- Specific, feasible future studies.
- How future work would improve the present design or address its limitations.

Recommendations should follow from the results. For example, propose a new experiment, broader threat model, additional deployment environment, longitudinal study, or independent replication rather than simply saying “more research is needed.”

#### Overall evaluation

The conclusion should answer the research question directly, summarise the evidence that supports the answer, state the contribution, and define the boundaries of the claim. It should not introduce a new result or citation that was not developed earlier.

## 4. Evidence Map for This Repository

Use the repository as supporting evidence, but keep the dissertation understandable without requiring the reader to inspect every file.

| Dissertation need                    | Candidate repository evidence                                                      |
| ------------------------------------ | ---------------------------------------------------------------------------------- |
| Artefact and implementation          | `src/`, `prisma/`, `routes.md`, and the specification/design discussion            |
| Functional and security verification | `tests/`, including authentication, attack, variant, JWT, OAuth, and session tests |
| Reproducibility procedure            | `docs/REPRODUCIBILITY_CHECKLIST.md`                                                |
| Performance evidence                 | `docs/performance-results/` and `scripts/analyze-performance.ts`                   |
| Generated evaluation evidence        | `docs/generated/` and `ai-generated/`                                              |
| Deployment or operational evidence   | `Dockerfile`, health checks, and production scripts                                |

For the current AI evaluation, use `ai-generated/cohorts/ai-clean-2026-10-05/study-manifest.json` and `aggregate/arms/<provider-prompt-arm>/results/ai-samples-failure-rates.csv`, with `docs/generated/AI_PROVIDER_PROMPT_COMPARISON_BLINDED.md` for the blinded view and `docs/generated/AI_PROVIDER_PROMPT_COMPARISON.md` for arm identities. There are four arms of 90 outputs each (360 total); the current heuristic failure count is 342/360 (95.0%). OpenAI neutral/guided paired inference is suppressed because system fingerprints differ. These are static heuristic outcomes, not runtime security results or human ratings. Treat `ai-generated/arms/`, `ai-generated/results/`, and `docs/generated/AI_EVALUATION_SUMMARY.md` as legacy snapshots.

For every cited artefact, record the run date, commit or version, relevant configuration, and the exact command needed to reproduce it. Archive the final evidence set so that generated results cannot silently change after submission.

## 5. Final Submission Audit

Complete this audit before submission:

- [ ] The research question is stated consistently throughout the dissertation.
- [ ] Every objective is answered by a result and a conclusion.
- [ ] The literature review compares and evaluates sources rather than listing them.
- [ ] Methodological choices are justified with literature and linked to the evaluation.
- [ ] The final implementation is compared with the specification and design.
- [ ] Design changes are documented and justified.
- [ ] Ethical status and human-participant applicability are stated accurately.
- [ ] Results include enough detail to judge reliability and reproduce the work.
- [ ] AI sample counts distinguish one 90-sample arm from the complete 360-sample study.
- [ ] AI percentages identify their denominator and whether they are arm-specific or pooled.
- [ ] The reported overall AI failure count is consistent with the current four arm totals: 342/360, with heuristic scope and inference suppression stated.
- [ ] Security, performance, and other evaluation strands are not conflated.
- [ ] Limitations are specific and their impact on validity is explained.
- [ ] Conclusions answer the research question without overclaiming.
- [ ] Recommendations follow from the evidence and are actionable.
- [ ] Harvard citations and the reference list are complete and consistent.
- [ ] Figures, tables, appendices, contents, formatting, and word count meet the template requirements.
- [ ] The final repository, generated reports, database/configuration assumptions, and reproducibility instructions are archived.

## 6. A Practical Editing Pass

Use three passes rather than trying to perfect every paragraph at once:

1. **Argument pass:** check that each chapter advances the research question.
2. **Evidence pass:** check citations, traceability, measurements, limitations, and reproducibility.
3. **Presentation pass:** check structure, language, formatting, figures, tables, references, and word count.

The final test is whether a reader can move from the problem to the conclusion without having to infer the missing links.

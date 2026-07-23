# Cognitive Security Analysis

Generated: 2026-07-23T20:50:15.217Z
Regenerate: npm run analysis:structural

This report frames authentication security as a cognitive engineering problem by cross-referencing developer load, boundary stress, lifecycle burden, and cognitive error propagation.

## Formula Notes

- CMS combines severity, propagation, detectability, and repair effort as an exploratory proxy for cognitively fragile mistakes.
- CBS uses trust-boundary crossings, must-remember behaviors, and security flags to approximate boundary reasoning stress.
- CLB uses lifecycle steps, validation rules, and must-remember behaviors to estimate sequencing burden.
- CSPS blends CLI, CMS, CBS, CLB, and CEP with default weights $(0.18, 0.24, 0.18, 0.18, 0.22)$. 

## Weight Rationale

- CMS and CEP receive slightly higher weight in CSPS because the central research question is not just cognitive effort, but how cognitive slips create security-relevant cascades.
- CLI, CBS, and CLB are retained separately so the posture score remains interpretable rather than collapsing all burden into one undifferentiated measure.

## 1) Cognitive Load Index (CLI)

See docs/generated/COGNITIVE_LOAD_INDEX.md for the structural CLI table. Higher scores indicate greater developer memory and sequencing burden.

## 2) Cognitive Misconfiguration Sensitivity (CMS)

| Variant | Model | Error Mode | Detectability | Repair Effort | CMS Score | Reading |
|---|---|---|---|---|---:|---|
| OAuth Redirect Misconfiguration | OAuth2 | Overloaded boundary mapping | Medium | High | 7.40 | Developers must coordinate client registration, redirect allowlists, and code-delivery assumptions across multiple parties. |
| OAuth State Misconfiguration | OAuth2 | Sequence-binding slip | Low | High | 7.17 | The state value is easy to treat as boilerplate even though it anchors the entire cross-site response flow. |
| OAuth Scope Misconfiguration | OAuth2 | Privilege-governance overload | Medium | Medium | 5.79 | Scope semantics span client registration, token issuance, and resource-server interpretation. |
| JWT Audience Misconfiguration | JWT | Precision validation slip | Medium | Low | 5.47 | Audience and issuer checks are compact but easy to under-specify because the happy path still appears to work. |
| JWT Algorithm Misconfiguration | JWT | Catastrophic validation omission | Low | Medium | 7.27 | Algorithm policy sits in a small code path, but one omission undermines the entire trust decision. |
| JWT Expiry Misconfiguration | JWT | Temporal burden underestimation | Medium | Low | 5.76 | Time-based controls appear operationally simple, but their failure surface emerges only later through replay and containment delays. |
| Sessions Fixation Misconfiguration | Session | Lifecycle transition blind spot | Low | Medium | 6.86 | The authentication transition looks routine, so developers can forget that session rotation is a security-critical state transfer. |
| Sessions Cookie Flag Misconfiguration | Session | Invisible browser-default risk | Low | Low | 6.34 | Browser cookie semantics are partly implicit, making missing flags cognitively easy to overlook. |
| Sessions Logout Misconfiguration | Session | Revocation completeness blind spot | Medium | Medium | 6.06 | Logout feels like a UX action, but its server-side invalidation semantics are security-critical. |

## 3) Cognitive Boundary Stress (CBS)

| Model | Trust Boundary Crossings | Must-Remember Behaviors | CBS Score | Interpretation |
|---|---:|---:|---:|---|
| OAuth2 | 5 | 6 | 25.00 | Highest boundary stress because client, redirect, auth-server, token, and resource-server assumptions must all line up. |
| JWT | 3 | 5 | 18.50 | Boundary count is lower, but validation discipline keeps stress concentrated rather than diffuse. |
| Session | 3 | 5 | 18.50 | Boundary count is moderate, yet browser-side invisibility makes the effective stress easy to underestimate. |

## Sensitivity Analysis

| Weight Profile | OAuth2 | JWT | Session | Rank Order |
|---|---:|---:|---:|---|
| default | 22.36 | 17.95 | 17.77 | OAuth2 > JWT > Session |
| cognition_heavy | 26.42 | 21.01 | 20.73 | OAuth2 > JWT > Session |
| propagation_heavy | 18.64 | 15.20 | 15.08 | OAuth2 > JWT > Session |

## 4) Cognitive Lifecycle Burden (CLB)

| Model | Lifecycle Steps | Validation Rules | Must-Remember Behaviors | CLB Score | Interpretation |
|---|---:|---:|---:|---:|---|
| OAuth2 | 7 | 7 | 6 | 31.60 | OAuth2 mistakes propagate non-linearly because redirect, state, code, token, and scope checks compound across multiple trust boundaries. |
| JWT | 5 | 6 | 5 | 24.90 | JWT mistakes tend to propagate linearly through token issuance and validation rules, especially where signature and claim checks are weakened. |
| Session | 5 | 5 | 5 | 23.50 | Session mistakes often amplify quickly because one cookie or invalidation weakness can spill into replay, fixation, and impersonation outcomes. |

## 5) Cognitive Error Propagation (CEP)

| Model | Mean Propagation Score | Dominant Cognitive Slip | CEP Reading |
|---|---:|---|---|
| OAuth2 | 9.39 | Overloaded boundary mapping | OAuth2 mistakes propagate non-linearly because redirect, state, code, token, and scope checks compound across multiple trust boundaries. |
| JWT | 8.57 | Precision validation slip | JWT mistakes tend to propagate linearly through token issuance and validation rules, especially where signature and claim checks are weakened. |
| Session | 8.62 | Lifecycle transition blind spot | Session mistakes often amplify quickly because one cookie or invalidation weakness can spill into replay, fixation, and impersonation outcomes. |

## 6) Cognitive Security Posture Score (CSPS)

| Model | CLI Raw | Mean CMS | CBS | CLB | Mean CEP | CSPS |
|---|---:|---:|---:|---:|---:|---:|
| OAuth2 | 47.10 | 6.79 | 25.00 | 31.60 | 9.39 | 22.36 |
| JWT | 37.60 | 6.17 | 18.50 | 24.90 | 8.57 | 17.95 |
| Session | 37.60 | 6.42 | 18.50 | 23.50 | 8.62 | 17.77 |

## Interpretation

- Authentication security is partly a cognition problem: models differ not only in protocol design, but in how much memory, sequencing, and boundary reasoning developers must sustain to keep them secure.
- OAuth2 combines the highest sequence burden with the highest boundary stress, making it the most cognitively demanding model in this repository.
- JWT is shorter in lifecycle length, but cognitively fragile because one precision-validation omission has system-wide consequences.
- Sessions look simpler, but browser-coupled defaults create invisible risks that keep their cognitive security posture non-trivial.

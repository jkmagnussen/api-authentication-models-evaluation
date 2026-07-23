# Cross-Reference Synthesis

Generated: 2026-07-23T21:11:17.637Z
Regenerate: npm run analysis:structural

- Weighted Exploit Burden (WEB) uses $0.45 \times severity + 0.25 \times exploitability + 0.30 \times propagation$.
- Lifecycle Error Likelihood Proxy (LELP) uses $(1.4 \times lifecycleSteps + 1.3 \times mustRemember + 1.2 \times boundaryCrossings) \times (1 + WEB/20)$.

## 1) STRIDE vs Misconfiguration Variants

| Variant | Model | STRIDE Classes | Propagation Pattern | Propagation Score | Structural Reading |
|---|---|---|---|---:|---|
| OAuth Redirect Misconfiguration | OAuth2 | Spoofing<br>Tampering<br>Elevation of Privilege | non-linear | 10.00 | A single redirect allowlist error crosses the browser-client boundary, redirects the code to an attacker endpoint, and then contaminates the token issuance stage. |
| OAuth State Misconfiguration | OAuth2 | Tampering<br>Spoofing | non-linear | 9.33 | State validation failure does not stop at one parameter check; it propagates into the user-session binding decision and can reassign downstream tokens to the wrong principal. |
| OAuth Scope Misconfiguration | OAuth2 | Elevation of Privilege<br>Tampering | fan-out | 8.83 | A scope governance error fans out from client registration into token claims and then every protected resource that trusts those claims. |
| JWT Audience Misconfiguration | JWT | Spoofing<br>Elevation of Privilege | linear | 7.63 | Weak audience checks propagate almost directly from token verification into route acceptance, so the failure path is short but security-relevant. |
| JWT Algorithm Misconfiguration | JWT | Spoofing<br>Tampering<br>Elevation of Privilege | linear | 9.63 | Algorithm confusion is a classic linear cascade: forged token, accepted signature, trusted route access, then authorization bypass. |
| JWT Expiry Misconfiguration | JWT | Repudiation<br>Spoofing | linear | 8.46 | Extended token lifetime enlarges the replay window and delays containment, so the propagation is temporal rather than branching. |
| Sessions Fixation Misconfiguration | Session | Spoofing<br>Elevation of Privilege | fan-out | 8.46 | A fixation bug turns the login transition itself into the propagation point, binding the victim identity to attacker-controlled state. |
| Sessions Cookie Flag Misconfiguration | Session | Information Disclosure<br>Spoofing | fan-out | 8.96 | Cookie hardening failures propagate outward because once a browser-side boundary is weakened, every subsequent session-bearing request inherits that weakness. |
| Sessions Logout Misconfiguration | Session | Spoofing<br>Repudiation | fan-out | 8.46 | Failure to invalidate the server-side session after logout turns a single missed revocation event into a continuing authenticated replay path. |

## 2) Trust Boundaries vs Attack Evidence

| Model | Primary Boundary | Attack Evidence | Structural Failure | Boundary-Centric Reading |
|---|---|---|---|---|
| OAuth2 | Redirect / authorization-code boundary | tests/attacks/oauth/redirect.test.ts<br>tests/attacks/oauth/state.test.ts<br>tests/attacks/oauth/replay.test.ts<br>tests/attacks/oauth/scope-escalation.high-impact.test.ts | Incorrect redirect, state, or scope handling crosses browser, client, and authorization-server boundaries before reaching the resource layer. | OAuth2 fails structurally at the redirect and response-binding boundaries, where a single trust-transfer error contaminates multiple downstream stages. |
| JWT | Client storage / token-validation boundary | tests/attacks/jwt/audience-issuer-mismatch.test.ts<br>tests/attacks/jwt/claim-abuse.test.ts | The main structural failure occurs when untrusted tokens cross from client-controlled storage or transport into server-side validation with weakened checks. | JWT failures are concentrated at the token-validation boundary: fewer hops than OAuth2, but high precision stress on signature and claim discipline. |
| Session | Browser cookie / server session boundary | tests/attacks/sessions/csrf.test.ts<br>tests/attacks/sessions/fixation.test.ts<br>tests/attacks/auth.security.test.ts | Browser-managed cookies cross into server trust with auto-send behavior, making hidden browser defaults a key structural risk surface. | Sessions fail structurally at the browser boundary: cookies are easy to deploy, but browser behavior can silently magnify mistakes. |

## 3) Performance Overhead vs Security Resilience

| Model | Avg Latency Delta % | Throughput Delta % | Weighted Exploit Burden | Pareto Reading |
|---|---:|---:|---:|---|
| OAuth2 | 2.92 | -2.83 | 6.70 | Highest boundary complexity with modest measured latency overhead, indicating structural burden is not captured by latency alone. |
| JWT | -1.68 | 1.71 | 6.60 | Fastest execution profile, but high validation fragility means small mistakes remain costly. |
| Session | -32.10 | 47.28 | 6.45 | Lower measured attack latency overhead does not imply lower structural risk; browser-coupled failures still propagate sharply. |

## 4) Lifecycle Complexity vs Developer Error Likelihood

| Model | Lifecycle Steps | Must-Remember Behaviors | Controlled Variant Count | Error Likelihood Proxy | Interpretation |
|---|---:|---:|---:|---:|---|
| OAuth2 | 7 | 6 | 3 | 31.51 | Most sequence-heavy model; controlled variant count is fixed, so the proxy reflects burden per step rather than raw frequency. |
| JWT | 5 | 5 | 3 | 22.75 | Fewer steps than OAuth2, but each validation slip has higher precision sensitivity. |
| Session | 5 | 5 | 3 | 22.62 | Simple lifecycle, but browser defaults keep the hidden-error burden meaningful. |

## 5) Protocol Assumptions vs Real Attack Behaviour

| Model | Protocol Assumption | Empirical Evidence | Observed Behaviour | Alignment |
|---|---|---|---|---|
| OAuth2 | State binding prevents authorization-response confusion. | tests/attacks/oauth/state.test.ts<br>tests/attacks/oauth/replay.test.ts | When state validation is weakened, authorization-code exchange succeeds under mismatched state and the flow collapses structurally. | Theory matches practice only when state is implemented correctly. |
| OAuth2 | Redirect URI validation prevents code interception. | tests/attacks/oauth/redirect.test.ts | Misconfigured redirect handling allows code delivery to an attacker-controlled endpoint. | Empirical results strongly support the protocol assumption. |
| JWT | Stateless tokens reduce coordination overhead while preserving authorization if claims and signatures are verified rigorously. | tests/attacks/jwt/audience-issuer-mismatch.test.ts<br>docs/performance-results/analysis.md | JWT remains performance-light, but weak audience or algorithm validation creates immediate authorization failures. | The scaling assumption holds, but only under precise validation discipline. |
| Session | Cookie-backed sessions depend on browser constraints and revocation discipline to resist CSRF and replay. | tests/attacks/sessions/csrf.test.ts<br>tests/attacks/auth.security.test.ts | Session protection is robust when cookie flags and invalidation are correct, but browser-coupled mistakes expose fixation and replay paths quickly. | Theory and empirical behavior align closely at the browser boundary. |

## 6) Attack Surface vs Code Footprint

| Model | Characters | Lines | Cyclomatic Complexity | Mean Propagation Score | Reading |
|---|---:|---:|---:|---:|---|
| OAuth2 | 17703 | 613 | 209 | 9.39 | Largest baseline footprint also coincides with the broadest propagation surface. |
| JWT | 5934 | 160 | 112 | 8.57 | Smaller footprint does not guarantee safety; the slice is compact but high-impact when validation is weak. |
| Session | 6974 | 201 | 146 | 8.62 | Moderate footprint aligns with a narrower surface, but browser-linked failures remain operationally sharp. |

## 7) Misconfiguration Propagation vs Performance Jitter

| Model | Mean Propagation Score | Attack Avg Outliers | 95% CI Width for Avg Delta % | Interpretation |
|---|---:|---:|---:|---|
| OAuth2 | 9.39 | 0 | 117.51 | No repeated-run attack outliers flagged; structural risk here is driven more by exploitability than jitter. |
| JWT | 8.57 | 0 | 134.89 | No repeated-run attack outliers flagged; structural risk here is driven more by exploitability than jitter. |
| Session | 8.62 | 2 | 116.93 | Propagation-heavy weaknesses coincide with measurable repeated-run instability and should be interpreted conservatively. |

## Sensitivity Analysis

### Weighted Exploit Burden Sensitivity

| Weight Profile | OAuth2 | JWT | Session | Rank Order |
|---|---:|---:|---:|---|
| default | 6.70 | 6.60 | 6.45 | OAuth2 > JWT > Session |
| severity_heavy | 5.94 | 5.98 | 5.86 | JWT > OAuth2 > Session |
| propagation_heavy | 7.56 | 7.25 | 7.15 | OAuth2 > JWT > Session |

### Lifecycle Error Likelihood Sensitivity

| Weight Profile | OAuth2 | JWT | Session | Rank Order |
|---|---:|---:|---:|---|
| default | 31.51 | 22.75 | 22.62 | OAuth2 > JWT > Session |
| lifecycle_heavy | 34.04 | 24.61 | 24.47 | OAuth2 > JWT > Session |
| boundary_heavy | 32.57 | 22.88 | 22.75 | OAuth2 > JWT > Session |

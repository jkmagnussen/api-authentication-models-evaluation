# Advanced Security Research Analysis

Generated: 2026-07-23T03:49:03.824Z
Regenerate: npm run research:advanced

This report operationalizes advanced dissertation analyses over the existing baseline, controlled misconfiguration, and AI-generated evidence layers.

## 1) Misconfiguration Propagation Analysis

| Variant | Severity | Propagation Chain | Secondary Failure Triggered | Proof |
|---|---|---|---|---|
| oauth-redirect-misconfiguration | Critical (5) | Untrusted redirect URI accepted -> Authorization code interception -> Code replay at attacker endpoint -> Unauthorized token issuance | Yes | PASS |
| oauth-state-misconfiguration | High (4) | Missing or unchecked OAuth state -> CSRF on authorization response -> Wrong user session binding -> Data leakage / account confusion | Yes | PASS |
| oauth-scope-misconfiguration | Medium (3) | Over-broad scope assignment -> Token carries elevated privileges -> Access-control boundary erosion -> Privilege abuse on protected resources | Yes | PASS |
| jwt-audience-misconfiguration | High (4) | Weak audience/issuer checks -> Cross-service token acceptance -> Improper trust transfer -> Unauthorized API access | Yes | PASS |
| jwt-algorithm-misconfiguration | Critical (5) | Weak/none JWT signature validation -> Token forgery -> Session or access-control bypass -> Privilege escalation | Yes | PASS |
| jwt-expiry-misconfiguration | High (4) | Excessive token lifetime -> Extended replay window -> Persisting unauthorized access -> Delayed incident containment | Yes | PASS |
| sessions-fixation-misconfiguration | Critical (5) | Session ID not rotated on login -> Attacker-known session remains valid -> Victim identity bound to attacker session -> Full authenticated takeover | Yes | PASS |
| sessions-cookie-flag-misconfiguration | High (4) | Missing HttpOnly cookie flag -> Cookie disclosure via script/XSS -> Session replay -> Authenticated data exposure | Yes | PASS |
| sessions-logout-misconfiguration | High (4) | Session not invalidated on logout -> Stolen cookie remains usable -> Replay after apparent sign-out -> Unauthorized persistence | Yes | PASS |

Interpretation: propagation chains model how a single configuration weakness can trigger downstream security failures across identity, session, and authorization layers.

## 2) Cross-Model Misconfiguration Mapping

| Misconfiguration Pattern | OAuth2 | JWT | Sessions | Typical Severity | Classification |
|---|---|---|---|---|---|
| Missing/weak OAuth state | Yes | No | No | Low (2) | Model-specific |
| Weak JWT algorithm enforcement | No | Yes | No | Critical (5) | Model-specific |
| Cookie hardening failure | No | No | Yes | High (4) | Model-specific |
| Trust-boundary validation weakness | Yes | Yes | Yes | High-Critical | Cross-model pattern |

- OAUTH average severity score: 4.00.
- JWT average severity score: 4.33.
- SESSIONS average severity score: 4.33.

## 3) AI Misconfiguration Signature Analysis

| AI Signature Pattern | Frequency | Models Affected |
|---|---:|---|
| redirect validation | 52 | OAUTH |
| scope control | 34 | OAUTH |
| audience/issuer validation | 12 | JWT |
| other security control | 8 | OAUTH |
| session invalidation | 6 | SESSIONS |
| session fixation resistance | 6 | SESSIONS |
| cookie hardening | 2 | SESSIONS |

Finding: recurring tags form an AI misconfiguration fingerprint, showing repeated control omissions rather than uniformly random errors.

## 4) Security vs Complexity Regression Curve

| Layer | Complexity Density (Cyclomatic per 100 LOC) (X) | Security Burden Rate % (Y) |
|---|---:|---:|
| Baseline | 60.69 | 0.00 |
| Misconfigured | 47.29 | 100.00 |
| AI-generated | n/a | 40.00 |

Regression line estimate: y = n/ax + n/a.

## 5) Authentication Model Difficulty Index (AMDI)

| Model | Complexity Factor | Moving Parts | Validation Evidence | Misconfiguration Points | Dependency Surface | AMDI (0-100) |
|---|---:|---:|---:|---:|---:|---:|
| OAUTH | 100.00 | 6 | 5 | 3 | 58 | 85.50 |
| JWT | 54.36 | 4 | 4 | 3 | 19 | 45.03 |
| SESSIONS | 69.74 | 4 | 4 | 3 | 15 | 48.41 |

AMDI is an original composite index in this repository and can be used to compare model difficulty against observed AI failure rates.

## 6) AI Determinism Analysis

| Model | Security Pass Rate | Cyclomatic StdDev | Maintainability StdDev | Security-Failure Tag Diversity |
|---|---:|---:|---:|---:|
| OAUTH | 10.00% | n/a | n/a | 3 |
| JWT | 90.00% | n/a | n/a | 1 |
| SESSIONS | 80.00% | n/a | n/a | 3 |

Interpretation: non-zero variance in complexity and security outcomes demonstrates instability of generated security quality across nominally similar samples.

## 7) Security Correctness vs Functional Correctness Gap

| Outcome Type | Sample Count | Meaning |
|---|---:|---|
| Functional PASS + Security PASS | 54 | Correct and secure under current local checks. |
| Functional PASS + Security FAIL | 0 | Correctness-security gap (appears correct but insecure). |
| Functional FAIL + Security PASS | 0 | Functionality failure without flagged security omission. |
| Functional FAIL + Security FAIL | 36 | Broad quality failure affecting correctness and security. |

## 8) Exploit Simulation Evidence

| Exploit Scenario | Model | Variant | Exploitability (0-10) | Focused Proof |
|---|---|---|---:|---|
| Redirect hijack / authorization-code interception | OAUTH | oauth-redirect-misconfiguration | 9 | PASS |
| Authorization CSRF / session confusion | OAUTH | oauth-state-misconfiguration | 10 | PASS |
| Privilege escalation via over-broad scopes | OAUTH | oauth-scope-misconfiguration | 6 | PASS |
| Cross-audience token replay | JWT | jwt-audience-misconfiguration | 8 | PASS |
| Token forgery via weak algorithm | JWT | jwt-algorithm-misconfiguration | 10 | PASS |
| Extended replay window abuse | JWT | jwt-expiry-misconfiguration | 7 | PASS |
| Session fixation takeover | SESSIONS | sessions-fixation-misconfiguration | 8 | PASS |
| Cookie theft and replay | SESSIONS | sessions-cookie-flag-misconfiguration | 7 | PASS |
| Post-logout replay | SESSIONS | sessions-logout-misconfiguration | 8 | PASS |

## 9) Developer Effort vs Security Outcome

| Model | Layer | Avg Chars | Avg Lines | Avg Functions | Avg Cyclomatic | Security Outcome |
|---|---|---:|---:|---:|---:|---|
| OAUTH | Baseline | 15273.00 | 542.00 | 16.00 | 195.00 | Secure baseline reference |
| OAUTH | Misconfigured | 17330.33 | 621.00 | 20.00 | 207.00 | Intentional exploit proofs: 3 / 3 |
| OAUTH | AI-generated | 2868.70 | 112.07 | 0.00 | n/a | Security failure rate: 90.00% |
| JWT | Baseline | 4847.00 | 155.00 | 14.00 | 106.00 | Secure baseline reference |
| JWT | Misconfigured | 6878.67 | 234.00 | 18.00 | 118.00 | Intentional exploit proofs: 3 / 3 |
| JWT | AI-generated | 2888.00 | 107.23 | 0.17 | n/a | Security failure rate: 10.00% |
| SESSIONS | Baseline | 5491.00 | 175.00 | 12.00 | 136.00 | Secure baseline reference |
| SESSIONS | Misconfigured | 7539.00 | 254.67 | 16.00 | 148.00 | Intentional exploit proofs: 3 / 3 |
| SESSIONS | AI-generated | 2984.60 | 116.70 | 0.00 | n/a | Security failure rate: 20.00% |

## Notes and Caveats

- AI analyses are based on current heuristic checks; semantic runtime verification of AI samples is a future extension.
- Exploit simulation evidence references controlled attack and variant tests already in this repository.
- AMDI is intentionally transparent and can be re-weighted for sensitivity analysis.

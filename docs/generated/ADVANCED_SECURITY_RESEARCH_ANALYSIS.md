# Advanced Security Research Analysis

Generated: 2026-07-24T23:11:33.890Z
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
| scope control | 30 | OAUTH |
| audience/issuer validation | 12 | JWT |
| other security control | 8 | OAUTH |
| session fixation resistance | 6 | SESSIONS |
| session invalidation | 4 | SESSIONS |

Finding: recurring tags form an AI misconfiguration fingerprint, showing repeated control omissions rather than uniformly random errors.

## 4) Security vs Complexity Regression Curve

| Layer | Complexity Density (Cyclomatic per 100 LOC) (X) | Security Burden Rate % (Y) |
|---|---:|---:|
| Baseline | 52.41 | 0.00 |
| Misconfigured | 42.59 | 100.00 |
| AI-generated | n/a | 37.78 |

Regression line estimate: y = n/ax + n/a.

## 5) Authentication Model Difficulty Index (AMDI)

| Model | Complexity Factor | Moving Parts | Validation Evidence | Misconfiguration Points | Dependency Surface | AMDI (0-100) |
|---|---:|---:|---:|---:|---:|---:|
| OAUTH | 100.00 | 6 | 5 | 3 | 62 | 87.50 |
| JWT | 53.59 | 4 | 4 | 3 | 23 | 46.76 |
| SESSIONS | 69.86 | 4 | 4 | 3 | 16 | 48.95 |

AMDI is an original composite index in this repository and can be used to compare model difficulty against observed AI failure rates.

## 6) AI Determinism Analysis

| Model | Security Pass Rate | Cyclomatic StdDev | Maintainability StdDev | Security-Failure Tag Diversity |
|---|---:|---:|---:|---:|
| OAUTH | 10.00% | n/a | n/a | 3 |
| JWT | 90.00% | n/a | n/a | 1 |
| SESSIONS | 86.67% | n/a | n/a | 2 |

Interpretation: non-zero variance in complexity and security outcomes demonstrates instability of generated security quality across nominally similar samples.

## 7) Security Correctness vs Functional Correctness Gap

| Outcome Type | Sample Count | Meaning |
|---|---:|---|
| Functional PASS + Security PASS | 56 | Correct and secure under current local checks. |
| Functional PASS + Security FAIL | 0 | Correctness-security gap (appears correct but insecure). |
| Functional FAIL + Security PASS | 0 | Functionality failure without flagged security omission. |
| Functional FAIL + Security FAIL | 34 | Broad quality failure affecting correctness and security. |

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
| OAUTH | Baseline | 16907.00 | 600.00 | 18.00 | 209.00 | Secure baseline reference |
| OAUTH | Misconfigured | 19173.00 | 684.00 | 22.00 | 221.00 | Intentional exploit proofs: 3 / 3 |
| OAUTH | AI-generated | 2648.87 | 101.50 | 0.67 | n/a | Security failure rate: 90.00% |
| JWT | Baseline | 5920.00 | 191.00 | 9.00 | 112.00 | Secure baseline reference |
| JWT | Misconfigured | 8174.00 | 275.00 | 13.00 | 124.00 | Intentional exploit proofs: 3 / 3 |
| JWT | AI-generated | 2571.37 | 96.57 | 0.60 | n/a | Security failure rate: 10.00% |
| SESSIONS | Baseline | 6977.00 | 229.00 | 12.00 | 146.00 | Secure baseline reference |
| SESSIONS | Misconfigured | 9208.67 | 313.67 | 16.00 | 158.00 | Intentional exploit proofs: 3 / 3 |
| SESSIONS | AI-generated | 2713.43 | 105.87 | 0.97 | n/a | Security failure rate: 13.33% |

## Notes and Caveats

- AI analyses are based on current heuristic checks; semantic runtime verification of AI samples is a future extension.
- Exploit simulation evidence references controlled attack and variant tests already in this repository.
- AMDI is intentionally transparent and can be re-weighted for sensitivity analysis.

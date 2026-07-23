# Variant Differential Report

Generated: 2026-07-23T19:41:17.755Z
Regenerate: npm run variants:report

This report maps each misconfiguration variant to the baseline security expectation and the focused exploit test that demonstrates the weakened behavior.

| Variant | Category | Severity | Exploitability (0-10) | STRIDE | OWASP Category | Baseline Evidence | Focused Exploit Test | Expected Misconfigured Outcome | Focused Command |
|---|---|---|---:|---|---|---|---|---|---|
| Oauth Redirect Misconfiguration | OAUTH | Critical (5) | 9 | Spoofing / Tampering | A01 Broken Access Control | tests/attacks/oauth/redirect.test.ts | tests/variants/oauth/redirect-misconfiguration.variant.test.ts | Untrusted redirect URI is accepted instead of rejected. | npm run test:variant:oauth:redirect |
| Oauth State Misconfiguration | OAUTH | High (4) | 10 | Tampering | A01 Broken Access Control | tests/attacks/oauth/replay.test.ts<br>tests/attacks/oauth/state.test.ts | tests/variants/oauth/state-misconfiguration.variant.test.ts | Authorization code exchange succeeds despite mismatched state. | npm run test:variant:oauth:state |
| Oauth Scope Misconfiguration | OAUTH | Medium (3) | 6 | Elevation of Privilege | A01 Broken Access Control | tests/attacks/oauth/scope.test.ts<br>tests/attacks/oauth/scope-escalation.high-impact.test.ts | tests/variants/oauth/scope-misconfiguration.variant.test.ts | Over-privileged scopes are granted to low-privilege clients. | npm run test:variant:oauth:scope |
| Jwt Audience Misconfiguration | JWT | High (4) | 8 | Spoofing | A07 Identification and Authentication Failures | tests/attacks/jwt/audience-issuer-mismatch.test.ts | tests/variants/jwt/audience-misconfiguration.variant.test.ts | Tokens minted for a weak audience value are accepted. | npm run test:variant:jwt:audience |
| Jwt Algorithm Misconfiguration | JWT | Critical (5) | 10 | Spoofing / Tampering | A08 Software and Data Integrity Failures | tests/attacks/jwt/audience-issuer-mismatch.test.ts<br>tests/attacks/jwt/claim-abuse.test.ts | tests/variants/jwt/algorithm-misconfiguration.variant.test.ts | Unsigned JWTs with alg=none are accepted. | npm run test:variant:jwt:algorithm |
| Jwt Expiry Misconfiguration | JWT | High (4) | 7 | Repudiation | A07 Identification and Authentication Failures | tests/jwt/integration/expiry.test.ts | tests/variants/jwt/expiry-misconfiguration.variant.test.ts | Issued JWT lifetime is extended far beyond a normal session lifetime. | npm run test:variant:jwt:expiry |
| Sessions Fixation Misconfiguration | SESSIONS | Critical (5) | 8 | Spoofing | A07 Identification and Authentication Failures | tests/attacks/sessions/fixation.test.ts<br>tests/attacks/auth.security.test.ts | tests/variants/sessions/fixation-misconfiguration.variant.test.ts | Attacker-controlled session id survives login. | npm run test:variant:sessions:fixation |
| Sessions Cookie Flag Misconfiguration | SESSIONS | High (4) | 7 | Information Disclosure | A05 Security Misconfiguration | tests/attacks/sessions/csrf.test.ts | tests/variants/sessions/cookie-flag-misconfiguration.variant.test.ts | Session cookie loses HttpOnly protection. | npm run test:variant:sessions:cookie |
| Sessions Logout Misconfiguration | SESSIONS | High (4) | 8 | Spoofing | A07 Identification and Authentication Failures | tests/attacks/auth.security.test.ts | tests/variants/sessions/logout-misconfiguration.variant.test.ts | Logged-out session remains valid for replay with stolen cookie. | npm run test:variant:sessions:logout |

## Interpretation

- Baseline evidence files document the secure expectation in the normal implementation.
- Focused exploit tests are intended to pass only when the corresponding misconfiguration is active.
- A successful focused variant run is evidence that the misconfiguration changes behavior in a security-relevant way.

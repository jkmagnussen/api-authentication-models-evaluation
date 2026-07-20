# Variant Differential Report

Generated: 2026-07-20T14:32:35.071Z
Regenerate: npm run variants:report

This report maps each misconfiguration variant to the baseline security expectation and the focused exploit test that demonstrates the weakened behavior.

| Variant | Category | Baseline Evidence | Focused Exploit Test | Expected Misconfigured Outcome | Focused Command |
|---|---|---|---|---|---|
| Oauth Redirect Misconfiguration | OAUTH | tests/attacks/oauth/redirect.test.ts | tests/variants/oauth/redirect-misconfiguration.variant.test.ts | Untrusted redirect URI is accepted instead of rejected. | npm run test:variant:oauth:redirect |
| Oauth State Misconfiguration | OAUTH | tests/attacks/oauth/replay.test.ts<br>tests/attacks/oauth/state.test.ts | tests/variants/oauth/state-misconfiguration.variant.test.ts | Authorization code exchange succeeds despite mismatched state. | npm run test:variant:oauth:state |
| Oauth Scope Misconfiguration | OAUTH | tests/attacks/oauth/scope.test.ts<br>tests/attacks/oauth/scope-escalation.high-impact.test.ts | tests/variants/oauth/scope-misconfiguration.variant.test.ts | Over-privileged scopes are granted to low-privilege clients. | npm run test:variant:oauth:scope |
| Jwt Audience Misconfiguration | JWT | tests/attacks/jwt/audience-issuer-mismatch.test.ts | tests/variants/jwt/audience-misconfiguration.variant.test.ts | Tokens minted for weak audience/issuer values are accepted. | npm run test:variant:jwt:audience |
| Jwt Algorithm Misconfiguration | JWT | tests/attacks/jwt/audience-issuer-mismatch.test.ts<br>tests/attacks/jwt/claim-abuse.test.ts | tests/variants/jwt/algorithm-misconfiguration.variant.test.ts | Unsigned JWTs with alg=none are accepted. | npm run test:variant:jwt:algorithm |
| Jwt Expiry Misconfiguration | JWT | tests/jwt/integration/expiry.test.ts | tests/variants/jwt/expiry-misconfiguration.variant.test.ts | Issued JWT lifetime becomes excessively long. | npm run test:variant:jwt:expiry |
| Sessions Fixation Misconfiguration | SESSIONS | tests/attacks/sessions/fixation.test.ts<br>tests/attacks/auth.security.test.ts | tests/variants/sessions/fixation-misconfiguration.variant.test.ts | Attacker-controlled session id survives login. | npm run test:variant:sessions:fixation |
| Sessions Cookie Flag Misconfiguration | SESSIONS | tests/attacks/sessions/csrf.test.ts | tests/variants/sessions/cookie-flag-misconfiguration.variant.test.ts | Session cookie loses HttpOnly protection. | npm run test:variant:sessions:cookie |
| Sessions Logout Misconfiguration | SESSIONS | tests/attacks/auth.security.test.ts | tests/variants/sessions/logout-misconfiguration.variant.test.ts | Logged-out session remains valid for replay with stolen cookie. | npm run test:variant:sessions:logout |

## Interpretation

- Baseline evidence files document the secure expectation in the normal implementation.
- Focused exploit tests are intended to pass only when the corresponding misconfiguration is active.
- A successful focused variant run is evidence that the misconfiguration changes behavior in a security-relevant way.

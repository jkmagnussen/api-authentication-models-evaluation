# Variant Focused Test Summary

Generated: 2026-07-21T18:00:23.251Z
Regenerate: npm run test:variants:focused

| Variant | Category | Severity | Exploitability (0-10) | Focused Test | Expected Regression | Result | Duration (ms) | Command |
|---|---|---|---:|---|---|---|---:|---|
| oauth-redirect-misconfiguration | OAUTH | Critical (5) | 9 | tests/variants/oauth/redirect-misconfiguration.variant.test.ts | Untrusted redirect URI is accepted instead of rejected. | PASS | 1490 | npm run test:variant:oauth:redirect |
| oauth-state-misconfiguration | OAUTH | Low (2) | 10 | tests/variants/oauth/state-misconfiguration.variant.test.ts | Authorization code exchange succeeds despite mismatched state. | PASS | 1492 | npm run test:variant:oauth:state |
| oauth-scope-misconfiguration | OAUTH | Medium (3) | 6 | tests/variants/oauth/scope-misconfiguration.variant.test.ts | Over-privileged scopes are granted to low-privilege clients. | PASS | 1497 | npm run test:variant:oauth:scope |
| jwt-audience-misconfiguration | JWT | High (4) | 8 | tests/variants/jwt/audience-misconfiguration.variant.test.ts | Tokens minted for weak audience/issuer values are accepted. | PASS | 1441 | npm run test:variant:jwt:audience |
| jwt-algorithm-misconfiguration | JWT | Critical (5) | 10 | tests/variants/jwt/algorithm-misconfiguration.variant.test.ts | Unsigned JWTs with alg=none are accepted. | PASS | 1431 | npm run test:variant:jwt:algorithm |
| jwt-expiry-misconfiguration | JWT | High (4) | 7 | tests/variants/jwt/expiry-misconfiguration.variant.test.ts | Issued JWT lifetime becomes excessively long. | PASS | 1472 | npm run test:variant:jwt:expiry |
| sessions-fixation-misconfiguration | SESSIONS | Critical (5) | 8 | tests/variants/sessions/fixation-misconfiguration.variant.test.ts | Attacker-controlled session id survives login. | PASS | 1458 | npm run test:variant:sessions:fixation |
| sessions-cookie-flag-misconfiguration | SESSIONS | High (4) | 7 | tests/variants/sessions/cookie-flag-misconfiguration.variant.test.ts | Session cookie loses HttpOnly protection. | PASS | 1468 | npm run test:variant:sessions:cookie |
| sessions-logout-misconfiguration | SESSIONS | High (4) | 8 | tests/variants/sessions/logout-misconfiguration.variant.test.ts | Logged-out session remains valid for replay with stolen cookie. | PASS | 1495 | npm run test:variant:sessions:logout |

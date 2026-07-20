# Variant Focused Test Summary

Generated: 2026-07-20T14:32:34.099Z
Regenerate: npm run test:variants:focused

| Variant | Category | Focused Test | Expected Regression | Result | Duration (ms) | Command |
|---|---|---|---|---|---:|---|
| oauth-redirect-misconfiguration | OAUTH | tests/variants/oauth/redirect-misconfiguration.variant.test.ts | Untrusted redirect URI is accepted instead of rejected. | PASS | 1501 | npm run test:variant:oauth:redirect |
| oauth-state-misconfiguration | OAUTH | tests/variants/oauth/state-misconfiguration.variant.test.ts | Authorization code exchange succeeds despite mismatched state. | PASS | 1501 | npm run test:variant:oauth:state |
| oauth-scope-misconfiguration | OAUTH | tests/variants/oauth/scope-misconfiguration.variant.test.ts | Over-privileged scopes are granted to low-privilege clients. | PASS | 1489 | npm run test:variant:oauth:scope |
| jwt-audience-misconfiguration | JWT | tests/variants/jwt/audience-misconfiguration.variant.test.ts | Tokens minted for weak audience/issuer values are accepted. | PASS | 1439 | npm run test:variant:jwt:audience |
| jwt-algorithm-misconfiguration | JWT | tests/variants/jwt/algorithm-misconfiguration.variant.test.ts | Unsigned JWTs with alg=none are accepted. | PASS | 1443 | npm run test:variant:jwt:algorithm |
| jwt-expiry-misconfiguration | JWT | tests/variants/jwt/expiry-misconfiguration.variant.test.ts | Issued JWT lifetime becomes excessively long. | PASS | 1480 | npm run test:variant:jwt:expiry |
| sessions-fixation-misconfiguration | SESSIONS | tests/variants/sessions/fixation-misconfiguration.variant.test.ts | Attacker-controlled session id survives login. | PASS | 1503 | npm run test:variant:sessions:fixation |
| sessions-cookie-flag-misconfiguration | SESSIONS | tests/variants/sessions/cookie-flag-misconfiguration.variant.test.ts | Session cookie loses HttpOnly protection. | PASS | 1490 | npm run test:variant:sessions:cookie |
| sessions-logout-misconfiguration | SESSIONS | tests/variants/sessions/logout-misconfiguration.variant.test.ts | Logged-out session remains valid for replay with stolen cookie. | PASS | 1502 | npm run test:variant:sessions:logout |

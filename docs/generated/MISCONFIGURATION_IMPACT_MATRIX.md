# Misconfiguration Impact Matrix

Generated: 2026-07-24T18:13:33.162Z
Regenerate: npm run compare:reports

This matrix ranks each intentional misconfiguration by impact severity and practical exploitation characteristics.

| Variant | Model | Severity | Exploitability (1-5) | Detectability (1-5) | Remediation Effort (1-5) | Focused Proof Result | Interpretation |
|---|---|---|---:|---:|---:|---|---|
| oauth-redirect-misconfiguration | OAUTH | Critical (5) | 5 | 4 | 3 | PASS | Untrusted redirect URI is accepted instead of rejected. Focused exploit proof passed. |
| jwt-algorithm-misconfiguration | JWT | Critical (5) | 5 | 3 | 2 | PASS | Unsigned JWTs with alg=none are accepted. Focused exploit proof passed. |
| sessions-fixation-misconfiguration | SESSIONS | Critical (5) | 4 | 2 | 3 | PASS | Attacker-controlled session id survives login. Focused exploit proof passed. |
| oauth-state-misconfiguration | OAUTH | High (4) | 5 | 3 | 2 | PASS | Authorization code exchange succeeds despite mismatched state. Focused exploit proof passed. |
| jwt-audience-misconfiguration | JWT | High (4) | 4 | 3 | 3 | PASS | Tokens minted for a weak audience value are accepted. Focused exploit proof passed. |
| jwt-expiry-misconfiguration | JWT | High (4) | 3 | 2 | 2 | PASS | Issued JWT lifetime is extended far beyond a normal session lifetime. Focused exploit proof passed. |
| sessions-cookie-flag-misconfiguration | SESSIONS | High (4) | 3 | 2 | 2 | PASS | Session cookie loses HttpOnly protection. Focused exploit proof passed. |
| sessions-logout-misconfiguration | SESSIONS | High (4) | 4 | 2 | 2 | PASS | Logged-out session remains valid for replay with stolen cookie. Focused exploit proof passed. |
| oauth-scope-misconfiguration | OAUTH | Medium (3) | 3 | 3 | 3 | PASS | Over-privileged scopes are granted to low-privilege clients. Focused exploit proof passed. |

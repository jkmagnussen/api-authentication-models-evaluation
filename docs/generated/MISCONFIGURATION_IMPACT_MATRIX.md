# Misconfiguration Impact Matrix

Generated: 2026-07-20T14:32:39.316Z
Regenerate: npm run compare:reports

This matrix ranks each intentional misconfiguration by impact severity and practical exploitation characteristics.

| Variant | Model | Severity | Exploitability (1-5) | Detectability (1-5) | Remediation Effort (1-5) | Focused Proof Result | Interpretation |
|---|---|---|---:|---:|---:|---|---|
| jwt-algorithm-misconfiguration | JWT | Critical (5) | 5 | 3 | 2 | PASS | Unsigned JWTs with alg=none are accepted. Focused exploit proof passed. |
| oauth-redirect-misconfiguration | OAUTH | High (4) | 4 | 4 | 3 | PASS | Untrusted redirect URI is accepted instead of rejected. Focused exploit proof passed. |
| oauth-state-misconfiguration | OAUTH | High (4) | 3 | 3 | 2 | PASS | Authorization code exchange succeeds despite mismatched state. Focused exploit proof passed. |
| oauth-scope-misconfiguration | OAUTH | High (4) | 4 | 3 | 3 | PASS | Over-privileged scopes are granted to low-privilege clients. Focused exploit proof passed. |
| jwt-audience-misconfiguration | JWT | High (4) | 4 | 3 | 3 | PASS | Tokens minted for weak audience/issuer values are accepted. Focused exploit proof passed. |
| sessions-fixation-misconfiguration | SESSIONS | High (4) | 4 | 2 | 3 | PASS | Attacker-controlled session id survives login. Focused exploit proof passed. |
| sessions-logout-misconfiguration | SESSIONS | High (4) | 4 | 2 | 2 | PASS | Logged-out session remains valid for replay with stolen cookie. Focused exploit proof passed. |
| jwt-expiry-misconfiguration | JWT | Medium (3) | 3 | 2 | 2 | PASS | Issued JWT lifetime becomes excessively long. Focused exploit proof passed. |
| sessions-cookie-flag-misconfiguration | SESSIONS | Medium (3) | 3 | 2 | 2 | PASS | Session cookie loses HttpOnly protection. Focused exploit proof passed. |

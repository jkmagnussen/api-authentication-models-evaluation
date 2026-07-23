# Dissertation Evaluation Table

This table is intended for direct reuse in the evaluation chapter.

| Variant | Secure Baseline Expectation | Misconfigured Exploit Outcome | Exact Command | Interpretation |
|---|---|---|---|---|
| OAuth Redirect Misconfiguration | Unregistered redirect URIs are rejected with a 400 error. | `http://evil.com` is accepted and an authorization code is issued. | `npm run test:variant:oauth:redirect` | Weak redirect validation enables authorization code leakage to attacker-controlled endpoints. |
| OAuth State Misconfiguration | Authorization code exchange fails when the returned `state` does not match. | Token exchange succeeds despite mismatched state. | `npm run test:variant:oauth:state` | Disabling state validation removes CSRF protection in the authorization flow. |
| OAuth Scope Misconfiguration | Low-privilege clients cannot request unauthorised scopes such as `admin`. | A basic client successfully receives an `admin`-scope authorization code. | `npm run test:variant:oauth:scope` | Scope over-granting breaks least privilege and enables privilege escalation. |
| JWT Audience Misconfiguration | Tokens with the wrong audience or issuer are rejected. | A token minted for `aud=anyone` and `iss=unknown` is accepted. | `npm run test:variant:jwt:audience` | Relaxed claim validation allows token confusion across trust boundaries. |
| JWT Algorithm Misconfiguration | Unsigned tokens are rejected. | An unsigned `alg=none` JWT is accepted as valid. | `npm run test:variant:jwt:algorithm` | Algorithm downgrade permits trivial token forgery. |
| JWT Expiry Misconfiguration | Tokens are short-lived and constrained to a normal session lifetime. | Issued JWT lifetime is extended to a long-lived value (`30d`). | `npm run test:variant:jwt:expiry` | Excessive expiry weakens revocation and increases the impact of token theft. |
| Session Fixation Misconfiguration | Session identifiers are regenerated on login and attacker-fixed IDs are invalidated. | An attacker-controlled session ID survives login and becomes bound to the victim. | `npm run test:variant:sessions:fixation` | Failure to regenerate the session enables classic fixation attacks. |
| Session Cookie Flag Misconfiguration | Session cookies are issued with `HttpOnly` protection. | The session cookie is issued without `HttpOnly`. | `npm run test:variant:sessions:cookie` | Weak cookie flags increase exposure to client-side theft via script execution. |
| Session Logout Misconfiguration | Logout invalidates the server-side session so a stolen cookie cannot be replayed. | The stolen cookie remains valid after logout and still accesses protected routes. | `npm run test:variant:sessions:logout` | Missing invalidation makes post-logout replay possible. |

## Design Alternatives And Tradeoffs

| Decision Area | Chosen Approach | Alternative Considered | Why Alternative Was Not Primary | Tradeoff Accepted |
|---|---|---|---|---|
| Misconfiguration modeling | Small targeted override on secure baseline | Build separate insecure implementations from scratch | Rewrites introduce many uncontrolled differences and weaken causal attribution | Less ecological variety in bug forms, stronger isolation of effect |
| AI evidence strategy | Artifact-level analysis arm, separate from runtime-swapped claims | Force all AI samples into executable runtime parity path | Many generated samples are structurally incomplete/non-interchangeable, causing confounded failures unrelated to intended controls | Structural evidence is clearer; behavioral equivalence claims are intentionally narrower |
| Reproducibility mode | Offline freeze lock plus verification | Fully live regeneration on every rerun | Live provider dependence and artifact drift reduce submission-time stability | Lower recency of live AI outputs, higher reproducibility integrity |
| Performance reporting | Repeated-run summaries plus baseline/attack comparison | Single-run headline metrics | Single runs are unstable and environment-sensitive | Additional run time cost in exchange for better statistical confidence |
| Evidence synthesis | Multi-artifact triangulation (tests, variants, performance, AI reports) | One dominant metric/report | Single-metric conclusions are easier to contest and less informative | Higher documentation overhead in exchange for stronger validity narrative |

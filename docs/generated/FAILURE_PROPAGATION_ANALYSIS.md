# Failure Propagation Analysis

Generated: 2026-07-23T20:43:34.233Z
Regenerate: npm run analysis:structural

This report models how each controlled authentication misconfiguration propagates beyond its initial defect point into downstream components, flows, and STRIDE consequences.

## Cross-Model Comparison

| Model | Mean Propagation Score (0-10) | Max Variant Score | Avg Components Touched | Avg Flows Touched | Avg STRIDE Breadth | Dominant Pattern |
|---|---:|---:|---:|---:|---:|---|
| OAuth2 | 9.39 | 10.00 | 4.00 | 3.00 | 2.33 | non-linear |
| JWT | 8.57 | 9.63 | 4.00 | 2.67 | 2.33 | linear |
| Session | 8.62 | 8.96 | 4.00 | 3.00 | 2.00 | fan-out |

## Propagation Graphs

### OAuth2

```mermaid
flowchart LR
  oauthredirectmisconfiguration["OAuth Redirect Misconfiguration"]
  oauthredirectmisconfigurationC0["redirect URI allowlist"]
  oauthredirectmisconfiguration --> oauthredirectmisconfigurationC0
  oauthredirectmisconfigurationC1["authorization endpoint"]
  oauthredirectmisconfiguration --> oauthredirectmisconfigurationC1
  oauthredirectmisconfigurationC2["authorization code store"]
  oauthredirectmisconfiguration --> oauthredirectmisconfigurationC2
  oauthredirectmisconfigurationC3["token issuer"]
  oauthredirectmisconfiguration --> oauthredirectmisconfigurationC3
  oauthredirectmisconfigurationF0["client redirect validation"]
  oauthredirectmisconfigurationC0 --> oauthredirectmisconfigurationF0
  oauthredirectmisconfigurationF1["authorization code delivery"]
  oauthredirectmisconfigurationC1 --> oauthredirectmisconfigurationF1
  oauthredirectmisconfigurationF2["token exchange"]
  oauthredirectmisconfigurationC2 --> oauthredirectmisconfigurationF2
  oauthredirectmisconfigurationS0["Spoofing"]
  oauthredirectmisconfigurationF0 --> oauthredirectmisconfigurationS0
  oauthredirectmisconfigurationS1["Tampering"]
  oauthredirectmisconfigurationF1 --> oauthredirectmisconfigurationS1
  oauthredirectmisconfigurationS2["Elevation of Privilege"]
  oauthredirectmisconfigurationF2 --> oauthredirectmisconfigurationS2
  oauthstatemisconfiguration["OAuth State Misconfiguration"]
  oauthstatemisconfigurationC0["state generator"]
  oauthstatemisconfiguration --> oauthstatemisconfigurationC0
  oauthstatemisconfigurationC1["authorization response handler"]
  oauthstatemisconfiguration --> oauthstatemisconfigurationC1
  oauthstatemisconfigurationC2["session binding"]
  oauthstatemisconfiguration --> oauthstatemisconfigurationC2
  oauthstatemisconfigurationC3["token endpoint"]
  oauthstatemisconfiguration --> oauthstatemisconfigurationC3
  oauthstatemisconfigurationF0["state correlation"]
  oauthstatemisconfigurationC0 --> oauthstatemisconfigurationF0
  oauthstatemisconfigurationF1["authorization response binding"]
  oauthstatemisconfigurationC1 --> oauthstatemisconfigurationF1
  oauthstatemisconfigurationF2["token exchange"]
  oauthstatemisconfigurationC2 --> oauthstatemisconfigurationF2
  oauthstatemisconfigurationS0["Tampering"]
  oauthstatemisconfigurationF0 --> oauthstatemisconfigurationS0
  oauthstatemisconfigurationS1["Spoofing"]
  oauthstatemisconfigurationF1 --> oauthstatemisconfigurationS1
  oauthscopemisconfiguration["OAuth Scope Misconfiguration"]
  oauthscopemisconfigurationC0["client scope policy"]
  oauthscopemisconfiguration --> oauthscopemisconfigurationC0
  oauthscopemisconfigurationC1["authorization endpoint"]
  oauthscopemisconfiguration --> oauthscopemisconfigurationC1
  oauthscopemisconfigurationC2["token claims builder"]
  oauthscopemisconfiguration --> oauthscopemisconfigurationC2
  oauthscopemisconfigurationC3["resource authorization"]
  oauthscopemisconfiguration --> oauthscopemisconfigurationC3
  oauthscopemisconfigurationF0["scope negotiation"]
  oauthscopemisconfigurationC0 --> oauthscopemisconfigurationF0
  oauthscopemisconfigurationF1["token minting"]
  oauthscopemisconfigurationC1 --> oauthscopemisconfigurationF1
  oauthscopemisconfigurationF2["resource access"]
  oauthscopemisconfigurationC2 --> oauthscopemisconfigurationF2
  oauthscopemisconfigurationS0["Elevation of Privilege"]
  oauthscopemisconfigurationF0 --> oauthscopemisconfigurationS0
  oauthscopemisconfigurationS1["Tampering"]
  oauthscopemisconfigurationF1 --> oauthscopemisconfigurationS1
```

- OAuth2 mistakes propagate non-linearly because redirect, state, code, token, and scope checks compound across multiple trust boundaries.

### JWT

```mermaid
flowchart LR
  jwtaudiencemisconfiguration["JWT Audience Misconfiguration"]
  jwtaudiencemisconfigurationC0["audience validator"]
  jwtaudiencemisconfiguration --> jwtaudiencemisconfigurationC0
  jwtaudiencemisconfigurationC1["issuer validator"]
  jwtaudiencemisconfiguration --> jwtaudiencemisconfigurationC1
  jwtaudiencemisconfigurationC2["JWT middleware"]
  jwtaudiencemisconfiguration --> jwtaudiencemisconfigurationC2
  jwtaudiencemisconfigurationC3["protected routes"]
  jwtaudiencemisconfiguration --> jwtaudiencemisconfigurationC3
  jwtaudiencemisconfigurationF0["token verification"]
  jwtaudiencemisconfigurationC0 --> jwtaudiencemisconfigurationF0
  jwtaudiencemisconfigurationF1["route authorization"]
  jwtaudiencemisconfigurationC1 --> jwtaudiencemisconfigurationF1
  jwtaudiencemisconfigurationS0["Spoofing"]
  jwtaudiencemisconfigurationF0 --> jwtaudiencemisconfigurationS0
  jwtaudiencemisconfigurationS1["Elevation of Privilege"]
  jwtaudiencemisconfigurationF1 --> jwtaudiencemisconfigurationS1
  jwtalgorithmmisconfiguration["JWT Algorithm Misconfiguration"]
  jwtalgorithmmisconfigurationC0["algorithm allowlist"]
  jwtalgorithmmisconfiguration --> jwtalgorithmmisconfigurationC0
  jwtalgorithmmisconfigurationC1["signature verifier"]
  jwtalgorithmmisconfiguration --> jwtalgorithmmisconfigurationC1
  jwtalgorithmmisconfigurationC2["JWT middleware"]
  jwtalgorithmmisconfiguration --> jwtalgorithmmisconfigurationC2
  jwtalgorithmmisconfigurationC3["protected routes"]
  jwtalgorithmmisconfiguration --> jwtalgorithmmisconfigurationC3
  jwtalgorithmmisconfigurationF0["header parsing"]
  jwtalgorithmmisconfigurationC0 --> jwtalgorithmmisconfigurationF0
  jwtalgorithmmisconfigurationF1["signature validation"]
  jwtalgorithmmisconfigurationC1 --> jwtalgorithmmisconfigurationF1
  jwtalgorithmmisconfigurationF2["route authorization"]
  jwtalgorithmmisconfigurationC2 --> jwtalgorithmmisconfigurationF2
  jwtalgorithmmisconfigurationS0["Spoofing"]
  jwtalgorithmmisconfigurationF0 --> jwtalgorithmmisconfigurationS0
  jwtalgorithmmisconfigurationS1["Tampering"]
  jwtalgorithmmisconfigurationF1 --> jwtalgorithmmisconfigurationS1
  jwtalgorithmmisconfigurationS2["Elevation of Privilege"]
  jwtalgorithmmisconfigurationF2 --> jwtalgorithmmisconfigurationS2
  jwtexpirymisconfiguration["JWT Expiry Misconfiguration"]
  jwtexpirymisconfigurationC0["token issuer"]
  jwtexpirymisconfiguration --> jwtexpirymisconfigurationC0
  jwtexpirymisconfigurationC1["expiry policy"]
  jwtexpirymisconfiguration --> jwtexpirymisconfigurationC1
  jwtexpirymisconfigurationC2["JWT middleware"]
  jwtexpirymisconfiguration --> jwtexpirymisconfigurationC2
  jwtexpirymisconfigurationC3["incident containment"]
  jwtexpirymisconfiguration --> jwtexpirymisconfigurationC3
  jwtexpirymisconfigurationF0["token issuance"]
  jwtexpirymisconfigurationC0 --> jwtexpirymisconfigurationF0
  jwtexpirymisconfigurationF1["replay window"]
  jwtexpirymisconfigurationC1 --> jwtexpirymisconfigurationF1
  jwtexpirymisconfigurationF2["route authorization"]
  jwtexpirymisconfigurationC2 --> jwtexpirymisconfigurationF2
  jwtexpirymisconfigurationS0["Repudiation"]
  jwtexpirymisconfigurationF0 --> jwtexpirymisconfigurationS0
  jwtexpirymisconfigurationS1["Spoofing"]
  jwtexpirymisconfigurationF1 --> jwtexpirymisconfigurationS1
```

- JWT mistakes tend to propagate linearly through token issuance and validation rules, especially where signature and claim checks are weakened.

### Session

```mermaid
flowchart LR
  sessionsfixationmisconfiguration["Sessions Fixation Misconfiguration"]
  sessionsfixationmisconfigurationC0["session ID rotation"]
  sessionsfixationmisconfiguration --> sessionsfixationmisconfigurationC0
  sessionsfixationmisconfigurationC1["session store"]
  sessionsfixationmisconfiguration --> sessionsfixationmisconfigurationC1
  sessionsfixationmisconfigurationC2["login flow"]
  sessionsfixationmisconfiguration --> sessionsfixationmisconfigurationC2
  sessionsfixationmisconfigurationC3["protected routes"]
  sessionsfixationmisconfiguration --> sessionsfixationmisconfigurationC3
  sessionsfixationmisconfigurationF0["pre-auth session setup"]
  sessionsfixationmisconfigurationC0 --> sessionsfixationmisconfigurationF0
  sessionsfixationmisconfigurationF1["login transition"]
  sessionsfixationmisconfigurationC1 --> sessionsfixationmisconfigurationF1
  sessionsfixationmisconfigurationF2["authenticated session reuse"]
  sessionsfixationmisconfigurationC2 --> sessionsfixationmisconfigurationF2
  sessionsfixationmisconfigurationS0["Spoofing"]
  sessionsfixationmisconfigurationF0 --> sessionsfixationmisconfigurationS0
  sessionsfixationmisconfigurationS1["Elevation of Privilege"]
  sessionsfixationmisconfigurationF1 --> sessionsfixationmisconfigurationS1
  sessionscookieflagmisconfiguration["Sessions Cookie Flag Misconfiguration"]
  sessionscookieflagmisconfigurationC0["cookie hardening"]
  sessionscookieflagmisconfiguration --> sessionscookieflagmisconfigurationC0
  sessionscookieflagmisconfigurationC1["browser storage"]
  sessionscookieflagmisconfiguration --> sessionscookieflagmisconfigurationC1
  sessionscookieflagmisconfigurationC2["session middleware"]
  sessionscookieflagmisconfiguration --> sessionscookieflagmisconfigurationC2
  sessionscookieflagmisconfigurationC3["protected routes"]
  sessionscookieflagmisconfiguration --> sessionscookieflagmisconfigurationC3
  sessionscookieflagmisconfigurationF0["cookie issuance"]
  sessionscookieflagmisconfigurationC0 --> sessionscookieflagmisconfigurationF0
  sessionscookieflagmisconfigurationF1["browser execution context"]
  sessionscookieflagmisconfigurationC1 --> sessionscookieflagmisconfigurationF1
  sessionscookieflagmisconfigurationF2["session replay"]
  sessionscookieflagmisconfigurationC2 --> sessionscookieflagmisconfigurationF2
  sessionscookieflagmisconfigurationS0["Information Disclosure"]
  sessionscookieflagmisconfigurationF0 --> sessionscookieflagmisconfigurationS0
  sessionscookieflagmisconfigurationS1["Spoofing"]
  sessionscookieflagmisconfigurationF1 --> sessionscookieflagmisconfigurationS1
  sessionslogoutmisconfiguration["Sessions Logout Misconfiguration"]
  sessionslogoutmisconfigurationC0["logout invalidation"]
  sessionslogoutmisconfiguration --> sessionslogoutmisconfigurationC0
  sessionslogoutmisconfigurationC1["session store"]
  sessionslogoutmisconfiguration --> sessionslogoutmisconfigurationC1
  sessionslogoutmisconfigurationC2["protected routes"]
  sessionslogoutmisconfiguration --> sessionslogoutmisconfigurationC2
  sessionslogoutmisconfigurationC3["session revocation logic"]
  sessionslogoutmisconfiguration --> sessionslogoutmisconfigurationC3
  sessionslogoutmisconfigurationF0["logout processing"]
  sessionslogoutmisconfigurationC0 --> sessionslogoutmisconfigurationF0
  sessionslogoutmisconfigurationF1["post-logout access"]
  sessionslogoutmisconfigurationC1 --> sessionslogoutmisconfigurationF1
  sessionslogoutmisconfigurationF2["cookie replay"]
  sessionslogoutmisconfigurationC2 --> sessionslogoutmisconfigurationF2
  sessionslogoutmisconfigurationS0["Spoofing"]
  sessionslogoutmisconfigurationF0 --> sessionslogoutmisconfigurationS0
  sessionslogoutmisconfigurationS1["Repudiation"]
  sessionslogoutmisconfigurationF1 --> sessionslogoutmisconfigurationS1
```

- Session mistakes often amplify quickly because one cookie or invalidation weakness can spill into replay, fixation, and impersonation outcomes.

## Variant Detail

| Variant | Model | Propagation Score | Components | Flows | STRIDE Breadth | Secondary Failures | Narrative |
|---|---|---:|---|---|---|---|---|
| OAuth Redirect Misconfiguration | OAuth2 | 10.00 | redirect URI allowlist<br>authorization endpoint<br>authorization code store<br>token issuer | client redirect validation<br>authorization code delivery<br>token exchange | Spoofing<br>Tampering<br>Elevation of Privilege | authorization code interception<br>token theft<br>unauthorized token issuance | A single redirect allowlist error crosses the browser-client boundary, redirects the code to an attacker endpoint, and then contaminates the token issuance stage. |
| OAuth State Misconfiguration | OAuth2 | 9.33 | state generator<br>authorization response handler<br>session binding<br>token endpoint | state correlation<br>authorization response binding<br>token exchange | Tampering<br>Spoofing | CSRF on auth response<br>wrong-account binding<br>session confusion | State validation failure does not stop at one parameter check; it propagates into the user-session binding decision and can reassign downstream tokens to the wrong principal. |
| OAuth Scope Misconfiguration | OAuth2 | 8.83 | client scope policy<br>authorization endpoint<br>token claims builder<br>resource authorization | scope negotiation<br>token minting<br>resource access | Elevation of Privilege<br>Tampering | over-privileged access token<br>resource overreach | A scope governance error fans out from client registration into token claims and then every protected resource that trusts those claims. |
| JWT Audience Misconfiguration | JWT | 7.63 | audience validator<br>issuer validator<br>JWT middleware<br>protected routes | token verification<br>route authorization | Spoofing<br>Elevation of Privilege | cross-service token reuse<br>unauthorized API access | Weak audience checks propagate almost directly from token verification into route acceptance, so the failure path is short but security-relevant. |
| JWT Algorithm Misconfiguration | JWT | 9.63 | algorithm allowlist<br>signature verifier<br>JWT middleware<br>protected routes | header parsing<br>signature validation<br>route authorization | Spoofing<br>Tampering<br>Elevation of Privilege | token forgery<br>privilege escalation<br>access-control bypass | Algorithm confusion is a classic linear cascade: forged token, accepted signature, trusted route access, then authorization bypass. |
| JWT Expiry Misconfiguration | JWT | 8.46 | token issuer<br>expiry policy<br>JWT middleware<br>incident containment | token issuance<br>replay window<br>route authorization | Repudiation<br>Spoofing | extended replay window<br>delayed revocation effect | Extended token lifetime enlarges the replay window and delays containment, so the propagation is temporal rather than branching. |
| Sessions Fixation Misconfiguration | Session | 8.46 | session ID rotation<br>session store<br>login flow<br>protected routes | pre-auth session setup<br>login transition<br>authenticated session reuse | Spoofing<br>Elevation of Privilege | session hijack<br>authenticated takeover | A fixation bug turns the login transition itself into the propagation point, binding the victim identity to attacker-controlled state. |
| Sessions Cookie Flag Misconfiguration | Session | 8.96 | cookie hardening<br>browser storage<br>session middleware<br>protected routes | cookie issuance<br>browser execution context<br>session replay | Information Disclosure<br>Spoofing | script-readable cookie<br>session theft<br>replay access | Cookie hardening failures propagate outward because once a browser-side boundary is weakened, every subsequent session-bearing request inherits that weakness. |
| Sessions Logout Misconfiguration | Session | 8.46 | logout invalidation<br>session store<br>protected routes<br>session revocation logic | logout processing<br>post-logout access<br>cookie replay | Spoofing<br>Repudiation | stolen cookie replay<br>unauthorized persistence | Failure to invalidate the server-side session after logout turns a single missed revocation event into a continuing authenticated replay path. |

## Interpretation

- Sessions concentrate failure in fewer moving parts, but once cookie or invalidation controls fail, authenticated replay and impersonation can propagate quickly.
- JWT propagation is comparatively linear: one weak validation step tends to map directly to one authorization failure path, which is easier to reason about but still severe.
- OAuth2 exhibits the widest propagation graph because redirect, state, code, token, and scope flows cross more boundaries and therefore branch more aggressively when weakened.

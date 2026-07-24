# Failure Propagation Analysis

Generated: 2026-07-24T11:49:22.822Z
Regenerate: npm run analysis:structural

This report models how each controlled authentication misconfiguration propagates beyond its initial defect point into downstream components, flows, and STRIDE consequences.

## Formula

$$
CFPA = 10 \times (0.25C + 0.25F + 0.20S + 0.15X + 0.15B)
$$

| Model | Mean Propagation Score (0-10) | Max Variant Score | Avg Components Touched | Avg Flows Touched | Avg STRIDE Breadth | Dominant Pattern |
|---|---:|---:|---:|---:|---:|---|
| OAuth2 | 9.39 | 10.00 | 4.00 | 3.00 | 2.33 | non-linear |
| JWT | 8.57 | 9.63 | 4.00 | 2.67 | 2.33 | linear |
| Session | 8.62 | 8.96 | 4.00 | 3.00 | 2.00 | fan-out |

## Sensitivity Analysis

| Weight Profile | OAuth2 | JWT | Session | Rank Order |
|---|---:|---:|---:|---|
| default | 9.39 | 8.57 | 8.62 | OAuth2 > Session > JWT |
| equal | 9.33 | 8.39 | 8.39 | OAuth2 > JWT > Session |
| boundary_heavy | 9.50 | 8.17 | 8.17 | OAuth2 > JWT > Session |

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

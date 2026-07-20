# Test Evidence Matrix

This matrix links the dissertation research controls to concrete test evidence in the repository.

## Security Attack Coverage

| Threat Area | Control Goal | Primary Evidence |
|---|---|---|
| OAuth replay and code reuse | Authorization codes are one-time use and race-safe | tests/attacks/oauth/replay.test.ts, tests/attacks/oauth/code-expiry-race.test.ts |
| OAuth client binding | Token exchange is bound to issuing client | tests/attacks/oauth/replay.test.ts |
| OAuth scope escalation | Unauthorized scopes are rejected | tests/attacks/oauth/scope.test.ts, tests/attacks/oauth/scope-escalation.high-impact.test.ts |
| OAuth redirect manipulation | Open redirect and polluted redirect parameters are rejected | tests/attacks/oauth/redirect.test.ts |
| OAuth refresh replay | Refresh token rotation and replay rejection | tests/attacks/oauth/refresh-rotation.test.ts, tests/attacks/oauth/refresh-rotation-race.test.ts |
| OAuth PKCE abuse/downgrade | PKCE verifier/method checks hold under malformed and downgrade attempts | tests/attacks/oauth/pkce-method-abuse.test.ts |
| Session fixation | Pre/post-login session fixation is prevented | tests/attacks/sessions/fixation.test.ts |
| Session CSRF | CSRF token/cookie enforcement works for protected actions | tests/attacks/sessions/csrf.test.ts |
| JWT aud/iss mismatch | Tokens for wrong audience/issuer are rejected | tests/attacks/jwt/audience-issuer-mismatch.test.ts |
| JWT claim abuse | Invalid claim structure (future nbf, missing userId) is rejected | tests/attacks/jwt/claim-abuse.test.ts |
| Brute force and throttling | Repeated auth attempts are rate-limited | tests/attacks/auth/bruteforce-rate-limit.test.ts, tests/attacks/auth.security.test.ts |
| Parameter pollution | Duplicate/array-form parameters are rejected | tests/attacks/oauth/parameter-pollution.test.ts |
| Error consistency and enumeration | Responses avoid account existence leakage and inconsistent auth errors | tests/attacks/auth/error-consistency.test.ts, tests/attacks/auth/login-enumeration.test.ts |
| Header ambiguity | Malformed auth headers are rejected deterministically | tests/attacks/auth/authorization-header-ambiguity.test.ts |
| Error leakage | Error responses avoid stack/internal leakage | tests/attacks/auth/error-leakage.test.ts |

## Functional Correctness Coverage

| Area | Evidence |
|---|---|
| OAuth integration flow | tests/oauth/integration/oauth.flow.test.ts, tests/oauth/integration/oauth.lifecycle.test.ts |
| OAuth unit logic | tests/oauth/unit/authorize.controller.test.ts, tests/oauth/unit/token.controller.test.ts, tests/oauth/unit/validateAuthorize.test.ts |
| JWT integration and unit logic | tests/jwt/integration/*.test.ts, tests/jwt/unit/*.test.ts |
| Session integration and unit logic | tests/sessions/integration/*.test.ts, tests/sessions/unit/*.test.ts |

## Performance Coverage

| Scenario | Evidence |
|---|---|
| Baseline JWT / OAuth / Sessions | tests/performance/baseline/*.test.ts |
| Attack JWT / OAuth / Sessions | tests/performance/attacks/*.test.ts |
| Summary report generation | tests/performance/summary.performance.test.ts, scripts/generate-performance-csv.ts |
| Statistical delta/effect output | scripts/analyze-performance.ts |

## Reproducibility Steps

1. Run all correctness/security tests: npm test
2. Run coverage: npm run test:coverage
3. Run one performance pass + analysis: npm run perf
4. Optional repeated performance sampling (set run id):
   - PowerShell: $env:PERF_RUN_ID="run-01"; npm run perf:once
   - Repeat for run-02, run-03, ...
   - Recompute stats: npm run perf:analyze

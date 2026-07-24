# Security-Critical Control Points

Generated: 2026-07-24T23:11:16.408Z
Regenerate: npm run code:footprint:tolerant

This exploratory report isolates high-impact control points and expresses observed failure pressure as density relative to implementation footprint.

## Control Definitions

| Model | Control Point | Canonical Severity (0-10) | Description |
|---|---|---:|---|
| OAuth2 | OAuth redirect URI validation | 9 | Authorization redirects must be strictly matched against trusted callback URIs. |
| OAuth2 | OAuth state binding | 10 | Authorization code exchange must fail when state does not match. |
| OAuth2 | OAuth scope enforcement | 6 | Token issuance must not grant over-privileged scopes. |
| JWT | JWT audience and issuer validation | 8 | Accepted JWTs must match trusted audience and issuer constraints. |
| JWT | JWT algorithm allowlist | 10 | Token verification must reject disallowed or unsigned algorithm values. |
| JWT | JWT expiry enforcement | 7 | Token lifetime should remain bounded to expected session duration. |
| Session | Session regeneration on authentication | 8 | Session identifiers should rotate across authentication boundaries. |
| Session | Session cookie protection | 7 | Session cookies should keep security flags such as HttpOnly and secure transport constraints. |
| Session | Session invalidation on logout | 8 | Logout should revoke server-side session state to prevent replay. |

## Control-Point Exposure

| Model | Source | Control Point | Chars | Failure Events | Severity (0-10) | Weighted Risk | Failures / 10k Chars | Risk / 10k Chars |
|---|---|---|---:|---:|---:|---:|---:|---:|
| OAuth2 | baseline | OAuth redirect URI validation | 16907 | 0 | 9.0 | 0.0 | 0.000 | 0.000 |
| OAuth2 | baseline | OAuth state binding | 16907 | 0 | 10.0 | 0.0 | 0.000 | 0.000 |
| OAuth2 | baseline | OAuth scope enforcement | 16907 | 0 | 6.0 | 0.0 | 0.000 | 0.000 |
| JWT | baseline | JWT audience and issuer validation | 5920 | 0 | 8.0 | 0.0 | 0.000 | 0.000 |
| JWT | baseline | JWT algorithm allowlist | 5920 | 0 | 10.0 | 0.0 | 0.000 | 0.000 |
| JWT | baseline | JWT expiry enforcement | 5920 | 0 | 7.0 | 0.0 | 0.000 | 0.000 |
| Session | baseline | Session regeneration on authentication | 6977 | 0 | 8.0 | 0.0 | 0.000 | 0.000 |
| Session | baseline | Session cookie protection | 6977 | 0 | 7.0 | 0.0 | 0.000 | 0.000 |
| Session | baseline | Session invalidation on logout | 6977 | 0 | 8.0 | 0.0 | 0.000 | 0.000 |
| OAuth2 | misconfiguration | OAuth redirect URI validation | 19205 | 1 | 9.0 | 9.0 | 0.521 | 4.686 |
| OAuth2 | misconfiguration | OAuth state binding | 19100 | 1 | 10.0 | 10.0 | 0.524 | 5.236 |
| OAuth2 | misconfiguration | OAuth scope enforcement | 19214 | 1 | 6.0 | 6.0 | 0.520 | 3.123 |
| JWT | misconfiguration | JWT audience and issuer validation | 8181 | 1 | 8.0 | 8.0 | 1.222 | 9.779 |
| JWT | misconfiguration | JWT algorithm allowlist | 8203 | 1 | 10.0 | 10.0 | 1.219 | 12.191 |
| JWT | misconfiguration | JWT expiry enforcement | 8138 | 1 | 7.0 | 7.0 | 1.229 | 8.602 |
| Session | misconfiguration | Session regeneration on authentication | 9222 | 1 | 8.0 | 8.0 | 1.084 | 8.675 |
| Session | misconfiguration | Session cookie protection | 9202 | 1 | 7.0 | 7.0 | 1.087 | 7.607 |
| Session | misconfiguration | Session invalidation on logout | 9202 | 1 | 8.0 | 8.0 | 1.087 | 8.694 |
| OAuth2 | ai | OAuth redirect URI validation | 87109 | 26 | 9.0 | 234.0 | 2.985 | 26.863 |
| OAuth2 | ai | OAuth state binding | 87109 | 0 | 10.0 | 0.0 | 0.000 | 0.000 |
| OAuth2 | ai | OAuth scope enforcement | 87109 | 15 | 6.0 | 90.0 | 1.722 | 10.332 |
| JWT | ai | JWT audience and issuer validation | 77141 | 3 | 8.0 | 24.0 | 0.389 | 3.111 |
| JWT | ai | JWT algorithm allowlist | 77141 | 0 | 10.0 | 0.0 | 0.000 | 0.000 |
| JWT | ai | JWT expiry enforcement | 77141 | 0 | 7.0 | 0.0 | 0.000 | 0.000 |
| Session | ai | Session regeneration on authentication | 81403 | 3 | 8.0 | 24.0 | 0.369 | 2.948 |
| Session | ai | Session cookie protection | 81403 | 0 | 7.0 | 0.0 | 0.000 | 0.000 |
| Session | ai | Session invalidation on logout | 81403 | 2 | 8.0 | 16.0 | 0.246 | 1.966 |

## Model-Level Aggregates

| Model | Source | Controls | Mean Chars | Failure Events Total | Weighted Risk Total | Avg Failures / 10k Chars | Avg Risk / 10k Chars |
|---|---|---:|---:|---:|---:|---:|---:|
| OAuth2 | baseline | 3 | 16907 | 0 | 0.0 | 0.000 | 0.000 |
| OAuth2 | misconfiguration | 3 | 19173 | 3 | 25.0 | 0.522 | 4.348 |
| OAuth2 | ai | 3 | 87109 | 41 | 324.0 | 1.569 | 12.398 |
| JWT | baseline | 3 | 5920 | 0 | 0.0 | 0.000 | 0.000 |
| JWT | misconfiguration | 3 | 8174 | 3 | 25.0 | 1.223 | 10.190 |
| JWT | ai | 3 | 77141 | 3 | 24.0 | 0.130 | 1.037 |
| Session | baseline | 3 | 6977 | 0 | 0.0 | 0.000 | 0.000 |
| Session | misconfiguration | 3 | 9209 | 3 | 23.0 | 1.086 | 8.325 |
| Session | ai | 3 | 81403 | 5 | 40.0 | 0.205 | 1.638 |

## Notes

- Baseline rows represent denominator context and intentionally carry zero observed failures.
- Misconfiguration rows map one intentional variant to one principal control-point regression.
- AI rows map failed sample tags to control points and apply canonical severity from the model's paired variant taxonomy.

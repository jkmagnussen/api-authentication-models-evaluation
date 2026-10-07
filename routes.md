# API Route Structure

## Sessions

- `POST /sessions/login`
- `POST /sessions/logout`
- `GET /sessions/protected`
- `GET /sessions/csrf-token` (issues a CSRF token and cookie for browser clients)
- `POST /sessions/protected-action` (requires a session cookie and CSRF token)

## JWT

- `POST /jwt/login`
- `GET /jwt/protected`

## OAuth

- `POST /oauth/authorize`
- `POST /oauth/token`
- `POST /oauth/refresh`
- `POST /oauth/revoke`
- `POST /oauth/introspect`
- `GET /oauth/protected`

## Supplementary Account Security (Not Part Of Primary Model Comparison)

- `POST /auth/security/password-reset/request`
- `POST /auth/security/password-reset/confirm`
- `POST /auth/security/mfa/enroll`
- `POST /auth/security/mfa/verify`

## Operational

- `GET /`
- `GET /health/live`
- `GET /health/ready`
- `GET /metrics`

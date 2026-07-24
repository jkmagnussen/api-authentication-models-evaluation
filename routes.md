# API Route Structure

## Sessions

- `POST /sessions/login`
- `POST /sessions/logout`
- `GET /sessions/protected`
- `GET /sessions/csrf` (not used)

## JWT

- `POST /jwt/login`
- `GET /jwt/protected`

## OAuth

- `POST /oauth/authorize`
- `POST /oauth/token`
- `GET /oauth/protected`

## Supplementary Account Security (Not Part Of Primary Model Comparison)

- `POST /auth/security/password-reset/request`
- `POST /auth/security/password-reset/confirm`
- `POST /auth/security/mfa/enroll`
- `POST /auth/security/mfa/verify`

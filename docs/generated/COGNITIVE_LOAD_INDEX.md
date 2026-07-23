# Cognitive Load Index

Generated: 2026-07-23T20:31:51.817Z
Regenerate: npm run analysis:structural

This report estimates model-specific developer cognitive load from configuration points, lifecycle steps, trust-boundary crossings, validation rules, and must-remember security behaviors.

| Model | Config Points | Security Flags | Lifecycle Steps | Trust Boundary Crossings | Validation Rules | Must-Remember Behaviors | Raw CLI | Normalized CLI (0-100) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| OAuth2 | 8 | 6 | 7 | 5 | 7 | 6 | 47.10 | 100.00 |
| JWT | 7 | 5 | 5 | 3 | 6 | 5 | 37.60 | 79.83 |
| Session | 8 | 5 | 5 | 3 | 5 | 5 | 37.60 | 79.83 |

## Reading

- OAuth2 carries the highest cognitive load because more moving parts must be remembered across redirect, state, PKCE, code exchange, token issuance, and scope enforcement.
- JWT sits in the middle: fewer round trips than OAuth2, but key management plus signature, audience, issuer, and expiry validation still impose non-trivial mental overhead.
- Sessions are operationally simpler at issue time, but correctness still depends on remembering cookie hardening, session rotation, store integrity, and revocation behavior.

## Interpretation Guardrail

The CLI is a developer-centric structural index, not a psychometric measurement. It is intended to compare implementation burden within this repository's controlled design, not to estimate universal human effort.

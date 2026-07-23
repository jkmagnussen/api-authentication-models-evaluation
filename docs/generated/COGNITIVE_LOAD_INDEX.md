# Cognitive Load Index

Generated: 2026-07-23T20:50:15.214Z
Regenerate: npm run analysis:structural

This report estimates model-specific developer cognitive load from configuration points, lifecycle steps, trust-boundary crossings, validation rules, and must-remember security behaviors.

## Formula

Default CLI is a weighted structural burden index:

$$
CLI = 1.2P + 1.1F + 1.3L + 1.0B + 1.2V + 1.4M
$$

Where $P$ is configuration points, $F$ security flags, $L$ lifecycle steps, $B$ trust-boundary crossings, $V$ validation rules, and $M$ must-remember behaviors.

## Weight Rationale

- Must-remember behaviors and lifecycle steps are weighted most heavily because they dominate sequencing and memory burden during secure implementation.
- Validation rules and configuration points are weighted next because they represent repeated opportunities for omission or inconsistency.
- Trust-boundary crossings and security flags remain explicit because they increase the number of contexts a developer must model correctly.

| Model | Config Points | Security Flags | Lifecycle Steps | Trust Boundary Crossings | Validation Rules | Must-Remember Behaviors | Raw CLI | Normalized CLI (0-100) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| OAuth2 | 8 | 6 | 7 | 5 | 7 | 6 | 47.10 | 100.00 |
| JWT | 7 | 5 | 5 | 3 | 6 | 5 | 37.60 | 79.83 |
| Session | 8 | 5 | 5 | 3 | 5 | 5 | 37.60 | 79.83 |

## Sensitivity Analysis

| Weight Profile | OAuth2 | JWT | Session | Rank Order |
|---|---:|---:|---:|---|
| default | 100.00 | 79.83 | 79.83 | OAuth2 > Session > JWT |
| lifecycle_heavy | 100.00 | 79.08 | 78.87 | OAuth2 > JWT > Session |
| boundary_heavy | 100.00 | 78.06 | 77.85 | OAuth2 > JWT > Session |

## Reading

- OAuth2 carries the highest cognitive load because more moving parts must be remembered across redirect, state, PKCE, code exchange, token issuance, and scope enforcement.
- JWT sits in the middle: fewer round trips than OAuth2, but key management plus signature, audience, issuer, and expiry validation still impose non-trivial mental overhead.
- Sessions are operationally simpler at issue time, but correctness still depends on remembering cookie hardening, session rotation, store integrity, and revocation behavior.

## Interpretation Guardrail

The CLI is a developer-centric structural index, not a psychometric measurement. It is intended to compare implementation burden within this repository's controlled design, not to estimate universal human effort.

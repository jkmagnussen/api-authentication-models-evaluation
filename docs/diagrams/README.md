# Dissertation Diagrams

These replacement figures are prepared against the current implementation:

- `implemented-persistence-model.svg` — all Prisma models, scalar fields,
  types, nullability, keys, uniqueness constraints, defaults, and relations in
  `prisma/schema.prisma`, plus the Prisma client and PostgreSQL datasource
  configuration.
- `implemented-api-architecture.svg` — the Express routes, middleware,
  mechanism behaviour, persistence, and separate evidence workflows.
- `figure-4-implemented-architecture.svg` — replacement dissertation Figure 4
  with schema-accurate persistence, selected AuditLog events, and evidence
  storage shown separately from application runtime state.
- `ai-generated-implementation-comparison-protocol.svg` — corrected Figure 3
  for the protocol-v2 AI cohort, including the per-output retry ceiling and
  suppressed paired prompt-effect inference.

## Suggested dissertation captions

- **Implemented Prisma persistence model for authentication, authorisation,
  and supplementary account-security state.**
- **Implemented unified API architecture, persistence boundaries, and separate
  evidence-generation workflows.**
- **Implemented API runtime and schema-accurate persistence, with selected
  audit events distinguished from per-request access logging and evaluation
  evidence stored separately.**
- **AI-generated implementation comparison protocol for the isolated
  protocol-v2 cohort.**

The architecture figure deliberately identifies the OAuth user identity as a
test-fixture input, distinguishes the evaluated `sessionId` model from the
application-level `appSessionId` Express middleware, and does not imply that
the protected OAuth route enforces scope-based access control.

The figures are deliberately detailed; insert them on landscape pages at page
width to preserve legibility. The persistence figure distinguishes schema
constraints from runtime behavior: token hashing is implemented by the service,
not declared in the Prisma schema.

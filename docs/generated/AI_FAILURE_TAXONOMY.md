# AI Failure Taxonomy

Generated: 2026-07-21T18:00:29.448Z
Regenerate: npm run compare:reports

This taxonomy groups AI sample security failures by control type to show where generated artifacts struggled most.

| Model | Control Category | Count | Example Triggers |
|---|---|---:|---|
| OAUTH | OAuth scope control | 12 | scope validation present |
| SESSIONS | Session cookie hardening | 12 | httpOnly cookie flag present; cookie not insecure none/false pair |
| JWT | JWT claim validation | 6 | audience validation present |
| JWT | JWT algorithm enforcement | 6 | secure algorithm enforced |
| JWT | JWT lifetime control | 6 | expiry not excessive |
| OAUTH | OAuth flow integrity | 6 | state handling present |
| OAUTH | Other security control | 6 | no permissive admin default |
| SESSIONS | Session lifecycle hardening | 6 | session regeneration present |
| SESSIONS | Session invalidation | 6 | logout invalidation present |

Interpretation: Higher counts indicate repeated weak spots in generated samples and are useful for prompt-hardening or stricter automated guardrails.

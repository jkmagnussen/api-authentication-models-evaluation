# Sentinel Controls Report

Generated: 2026-07-23T20:33:31.693Z
Regenerate: npm run objective:sentinel

Sentinel Control Status: PASS

Definitions:
- Positive sentinel trigger: each completed arm must have at least one failed sample (known-flawed pattern remains detectable).
- Negative sentinel trigger: each completed arm must have at least one passed sample (known-secure pattern remains detectable).

| Arm | Passed Samples (OVERALL) | Failed Samples (OVERALL) | Positive Sentinel | Negative Sentinel |
|---|---:|---:|---|---|
| openai-neutral | 46 | 44 | PASS | PASS |
| openai-security-guided | 56 | 34 | PASS | PASS |
| claude-neutral | 46 | 44 | PASS | PASS |
| claude-security-guided | 55 | 35 | PASS | PASS |

Overall positive sentinel: PASS
Overall negative sentinel: PASS

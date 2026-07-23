# Sentinel Controls Report

Generated: 2026-07-23T03:48:59.822Z
Regenerate: npm run objective:sentinel

Sentinel Control Status: FAIL

Definitions:
- Positive sentinel trigger: each completed arm must have at least one failed sample (known-flawed pattern remains detectable).
- Negative sentinel trigger: each completed arm must have at least one passed sample (known-secure pattern remains detectable).

| Arm | Passed Samples (OVERALL) | Failed Samples (OVERALL) | Positive Sentinel | Negative Sentinel |
|---|---:|---:|---|---|
| openai-neutral | 0 | 90 | PASS | FAIL |
| openai-security-guided | 58 | 32 | PASS | PASS |
| claude-neutral | 13 | 77 | PASS | PASS |
| claude-security-guided | 54 | 36 | PASS | PASS |

Overall positive sentinel: PASS
Overall negative sentinel: FAIL

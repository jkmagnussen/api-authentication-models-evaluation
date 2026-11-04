# Clean-Corpus Syntax and Heuristic Quadrants

Study ID: `ai-clean-2026-10-05`. Regenerate: `npx ts-node scripts/analyze-clean-syntax-quadrants.ts`.

Parse failure = `ts.createSourceFile` reports one or more parse diagnostics (structural parse only, not a TypeScript compile). Flagged = the local heuristic checks did not pass.

## Per arm and mechanism

| Arm | Mechanism | Outputs | Parse-clean | Heuristic-flagged |
|---|---|---:|---:|---:|
| claude-neutral | oauth | 30 | 0 | 29 |
| claude-neutral | jwt | 30 | 10 | 22 |
| claude-neutral | sessions | 30 | 1 | 30 |
| claude-security-guided | oauth | 30 | 0 | 30 |
| claude-security-guided | jwt | 30 | 1 | 25 |
| claude-security-guided | sessions | 30 | 0 | 30 |
| openai-neutral | oauth | 30 | 30 | 30 |
| openai-neutral | jwt | 30 | 30 | 30 |
| openai-neutral | sessions | 30 | 30 | 30 |
| openai-security-guided | oauth | 30 | 30 | 30 |
| openai-security-guided | jwt | 30 | 30 | 30 |
| openai-security-guided | sessions | 30 | 30 | 26 |

## Per arm

| Arm | Outputs | Parse-clean | Parse-failed | Flagged | Clean & unflagged | Clean & flagged | Failed & flagged | Failed & unflagged |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| claude-neutral | 90 | 11 | 79 | 81 | 0 | 11 | 70 | 9 |
| claude-security-guided | 90 | 1 | 89 | 85 | 0 | 1 | 84 | 5 |
| openai-neutral | 90 | 90 | 0 | 90 | 0 | 90 | 0 | 0 |
| openai-security-guided | 90 | 90 | 0 | 86 | 4 | 86 | 0 | 0 |

## Totals

- Outputs: 360
- Parse-clean: 192; parse-failed: 168 (46.7%)
- Heuristic-flagged: 342
- Clean & unflagged: 4; clean & flagged: 188
- Failed & flagged: 154; failed & unflagged: 14

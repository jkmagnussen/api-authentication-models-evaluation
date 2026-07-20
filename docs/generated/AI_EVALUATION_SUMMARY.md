# AI Evaluation Summary

Generated: 2026-07-20T14:32:40.298Z
Regenerate: npm run ai:report

This report aggregates the complexity metrics and automated check results for the 15 AI-generated authentication samples.

## Methodology Notes

- AI-generated samples are treated as independent artifacts, not runtime replacements for the baseline application.
- The AI checks are pattern-based heuristic screens for expected security properties and omissions; they are not semantic runtime verification.
- Because these checks are heuristic, false positives and false negatives are possible.
- Baseline and misconfigured variants are evaluated behaviorally with executable tests; AI samples are evaluated primarily as generated artifacts.
- The current local generators are deterministic. Repeated rounds are only useful for prompt-variance analysis if generation is later backed by an external model or nondeterministic provider.

## Failure-Rate Summary

| Model | Total Samples | Passed | Failed | Failure Rate | Interpretation |
|---|---:|---:|---:|---:|---|
| OAUTH | 5 | 3 | 2 | 40.0% | 2 of 5 samples contained detected omissions or insecure patterns. |
| JWT | 5 | 2 | 3 | 60.0% | 3 of 5 samples contained detected omissions or insecure patterns. |
| SESSIONS | 5 | 2 | 3 | 60.0% | 3 of 5 samples contained detected omissions or insecure patterns. |
| OVERALL | 15 | 7 | 8 | 53.3% | 8 of 15 samples contained detected omissions or insecure patterns. |

## OAUTH Samples

| Sample | Pass | Chars | Lines | Funcs | Classes | Cyclomatic | Maintainability | Security Failures | Interpretation |
|---|---|---:|---:|---:|---:|---:|---:|---|---|
| sample1 | PASS | 842 | 26 | 2 | 0 | 6 | 93.97 | None | Sample passed the local automated security checks. |
| sample2 | PASS | 822 | 25 | 2 | 0 | 7 | 89.92 | None | Sample passed the local automated security checks. |
| sample3 | FAIL | 435 | 15 | 1 | 0 | 3 | 106.09 | state handling present; scope validation present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample4 | FAIL | 663 | 21 | 1 | 0 | 6 | 93.21 | scope validation present; no permissive admin default | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample5 | PASS | 773 | 25 | 1 | 0 | 6 | 90.80 | None | Sample passed the local automated security checks. |

## JWT Samples

| Sample | Pass | Chars | Lines | Funcs | Classes | Cyclomatic | Maintainability | Security Failures | Interpretation |
|---|---|---:|---:|---:|---:|---:|---:|---|---|
| sample1 | PASS | 889 | 28 | 2 | 0 | 3 | 109.64 | None | Sample passed the local automated security checks. |
| sample2 | FAIL | 807 | 27 | 2 | 0 | 2 | 112.46 | audience validation present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample3 | FAIL | 828 | 27 | 2 | 0 | 2 | 109.95 | secure algorithm enforced | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample4 | PASS | 852 | 28 | 2 | 0 | 2 | 110.29 | None | Sample passed the local automated security checks. |
| sample5 | FAIL | 863 | 28 | 2 | 0 | 2 | 110.29 | expiry not excessive | Sample shows weaknesses or omissions relative to the expected secure baseline. |

## SESSIONS Samples

| Sample | Pass | Chars | Lines | Funcs | Classes | Cyclomatic | Maintainability | Security Failures | Interpretation |
|---|---|---:|---:|---:|---:|---:|---:|---|---|
| sample1 | PASS | 669 | 25 | 4 | 0 | 1 | 159.88 | None | Sample passed the local automated security checks. |
| sample2 | FAIL | 510 | 19 | 3 | 0 | 1 | 127.51 | session regeneration present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample3 | FAIL | 541 | 20 | 4 | 0 | 1 | 159.88 | httpOnly cookie flag present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample4 | FAIL | 532 | 19 | 3 | 0 | 1 | 142.97 | logout invalidation present; cookie not insecure none/false pair | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample5 | PASS | 533 | 20 | 4 | 0 | 1 | 159.88 | None | Sample passed the local automated security checks. |

## Output Files

- ai-generated/results/ai-samples-summary.csv
- ai-generated/results/ai-samples-failure-rates.csv
- ai-generated/results/*.json

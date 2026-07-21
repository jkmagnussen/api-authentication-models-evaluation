# AI Evaluation Summary

Generated: 2026-07-21T18:00:49.433Z
Regenerate: npm run ai:report

This report aggregates the complexity metrics and automated check results for 90 AI-generated authentication samples.

## Methodology Notes

- AI-generated samples are treated as independent artifacts, not runtime replacements for the baseline application.
- The AI checks are pattern-based heuristic screens for expected security properties and omissions; they are not semantic runtime verification.
- Because these checks are heuristic, false positives and false negatives are possible.
- Baseline and misconfigured variants are evaluated behaviorally with executable tests; AI samples are evaluated primarily as generated artifacts.
- The current local generators are deterministic. Repeated rounds are only useful for prompt-variance analysis if generation is later backed by an external model or nondeterministic provider.

## Failure-Rate Summary

| Model | Total Samples | Passed | Failed | Failure Rate | Interpretation |
|---|---:|---:|---:|---:|---|
| OAUTH | 30 | 18 | 12 | 40.0% | 12 of 30 samples contained detected omissions or insecure patterns. |
| JWT | 30 | 12 | 18 | 60.0% | 18 of 30 samples contained detected omissions or insecure patterns. |
| SESSIONS | 30 | 12 | 18 | 60.0% | 18 of 30 samples contained detected omissions or insecure patterns. |
| OVERALL | 90 | 42 | 48 | 53.3% | 48 of 90 samples contained detected omissions or insecure patterns. |

## OAUTH Samples

| Sample | Pass | Chars | Lines | Funcs | Classes | Cyclomatic | Maintainability | Security Failures | Interpretation |
|---|---|---:|---:|---:|---:|---:|---:|---|---|
| sample1 | PASS | 869 | 27 | 2 | 0 | 6 | 93.97 | None | Sample passed the local automated security checks. |
| sample2 | PASS | 849 | 26 | 2 | 0 | 7 | 89.92 | None | Sample passed the local automated security checks. |
| sample3 | FAIL | 462 | 16 | 1 | 0 | 3 | 106.09 | state handling present; scope validation present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample4 | FAIL | 690 | 22 | 1 | 0 | 6 | 93.21 | scope validation present; no permissive admin default | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample5 | PASS | 800 | 26 | 1 | 0 | 6 | 90.80 | None | Sample passed the local automated security checks. |
| sample6 | PASS | 869 | 27 | 2 | 0 | 6 | 93.97 | None | Sample passed the local automated security checks. |
| sample7 | PASS | 849 | 26 | 2 | 0 | 7 | 89.92 | None | Sample passed the local automated security checks. |
| sample8 | FAIL | 462 | 16 | 1 | 0 | 3 | 106.09 | state handling present; scope validation present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample9 | FAIL | 690 | 22 | 1 | 0 | 6 | 93.21 | scope validation present; no permissive admin default | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample10 | PASS | 801 | 26 | 1 | 0 | 6 | 90.80 | None | Sample passed the local automated security checks. |
| sample11 | PASS | 870 | 27 | 2 | 0 | 6 | 93.97 | None | Sample passed the local automated security checks. |
| sample12 | PASS | 850 | 26 | 2 | 0 | 7 | 89.92 | None | Sample passed the local automated security checks. |
| sample13 | FAIL | 463 | 16 | 1 | 0 | 3 | 106.09 | state handling present; scope validation present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample14 | FAIL | 691 | 22 | 1 | 0 | 6 | 93.21 | scope validation present; no permissive admin default | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample15 | PASS | 801 | 26 | 1 | 0 | 6 | 90.80 | None | Sample passed the local automated security checks. |
| sample16 | PASS | 870 | 27 | 2 | 0 | 6 | 93.97 | None | Sample passed the local automated security checks. |
| sample17 | PASS | 850 | 26 | 2 | 0 | 7 | 89.92 | None | Sample passed the local automated security checks. |
| sample18 | FAIL | 463 | 16 | 1 | 0 | 3 | 106.09 | state handling present; scope validation present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample19 | FAIL | 691 | 22 | 1 | 0 | 6 | 93.21 | scope validation present; no permissive admin default | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample20 | PASS | 801 | 26 | 1 | 0 | 6 | 90.80 | None | Sample passed the local automated security checks. |
| sample21 | PASS | 870 | 27 | 2 | 0 | 6 | 93.97 | None | Sample passed the local automated security checks. |
| sample22 | PASS | 850 | 26 | 2 | 0 | 7 | 89.92 | None | Sample passed the local automated security checks. |
| sample23 | FAIL | 463 | 16 | 1 | 0 | 3 | 106.09 | state handling present; scope validation present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample24 | FAIL | 691 | 22 | 1 | 0 | 6 | 93.21 | scope validation present; no permissive admin default | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample25 | PASS | 801 | 26 | 1 | 0 | 6 | 90.80 | None | Sample passed the local automated security checks. |
| sample26 | PASS | 870 | 27 | 2 | 0 | 6 | 93.97 | None | Sample passed the local automated security checks. |
| sample27 | PASS | 850 | 26 | 2 | 0 | 7 | 89.92 | None | Sample passed the local automated security checks. |
| sample28 | FAIL | 463 | 16 | 1 | 0 | 3 | 106.09 | state handling present; scope validation present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample29 | FAIL | 691 | 22 | 1 | 0 | 6 | 93.21 | scope validation present; no permissive admin default | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample30 | PASS | 801 | 26 | 1 | 0 | 6 | 90.80 | None | Sample passed the local automated security checks. |

## JWT Samples

| Sample | Pass | Chars | Lines | Funcs | Classes | Cyclomatic | Maintainability | Security Failures | Interpretation |
|---|---|---:|---:|---:|---:|---:|---:|---|---|
| sample1 | PASS | 916 | 29 | 2 | 0 | 3 | 109.64 | None | Sample passed the local automated security checks. |
| sample2 | FAIL | 834 | 28 | 2 | 0 | 2 | 112.46 | audience validation present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample3 | FAIL | 855 | 28 | 2 | 0 | 2 | 109.95 | secure algorithm enforced | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample4 | PASS | 879 | 29 | 2 | 0 | 2 | 110.29 | None | Sample passed the local automated security checks. |
| sample5 | FAIL | 890 | 29 | 2 | 0 | 2 | 110.29 | expiry not excessive | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample6 | PASS | 916 | 29 | 2 | 0 | 3 | 109.64 | None | Sample passed the local automated security checks. |
| sample7 | FAIL | 834 | 28 | 2 | 0 | 2 | 112.46 | audience validation present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample8 | FAIL | 855 | 28 | 2 | 0 | 2 | 109.95 | secure algorithm enforced | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample9 | PASS | 879 | 29 | 2 | 0 | 2 | 110.29 | None | Sample passed the local automated security checks. |
| sample10 | FAIL | 891 | 29 | 2 | 0 | 2 | 110.29 | expiry not excessive | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample11 | PASS | 917 | 29 | 2 | 0 | 3 | 109.64 | None | Sample passed the local automated security checks. |
| sample12 | FAIL | 835 | 28 | 2 | 0 | 2 | 112.46 | audience validation present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample13 | FAIL | 856 | 28 | 2 | 0 | 2 | 109.95 | secure algorithm enforced | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample14 | PASS | 880 | 29 | 2 | 0 | 2 | 110.29 | None | Sample passed the local automated security checks. |
| sample15 | FAIL | 891 | 29 | 2 | 0 | 2 | 110.29 | expiry not excessive | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample16 | PASS | 917 | 29 | 2 | 0 | 3 | 109.64 | None | Sample passed the local automated security checks. |
| sample17 | FAIL | 835 | 28 | 2 | 0 | 2 | 112.46 | audience validation present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample18 | FAIL | 856 | 28 | 2 | 0 | 2 | 109.95 | secure algorithm enforced | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample19 | PASS | 880 | 29 | 2 | 0 | 2 | 110.29 | None | Sample passed the local automated security checks. |
| sample20 | FAIL | 891 | 29 | 2 | 0 | 2 | 110.29 | expiry not excessive | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample21 | PASS | 917 | 29 | 2 | 0 | 3 | 109.64 | None | Sample passed the local automated security checks. |
| sample22 | FAIL | 835 | 28 | 2 | 0 | 2 | 112.46 | audience validation present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample23 | FAIL | 856 | 28 | 2 | 0 | 2 | 109.95 | secure algorithm enforced | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample24 | PASS | 880 | 29 | 2 | 0 | 2 | 110.29 | None | Sample passed the local automated security checks. |
| sample25 | FAIL | 891 | 29 | 2 | 0 | 2 | 110.29 | expiry not excessive | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample26 | PASS | 917 | 29 | 2 | 0 | 3 | 109.64 | None | Sample passed the local automated security checks. |
| sample27 | FAIL | 835 | 28 | 2 | 0 | 2 | 112.46 | audience validation present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample28 | FAIL | 856 | 28 | 2 | 0 | 2 | 109.95 | secure algorithm enforced | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample29 | PASS | 880 | 29 | 2 | 0 | 2 | 110.29 | None | Sample passed the local automated security checks. |
| sample30 | FAIL | 891 | 29 | 2 | 0 | 2 | 110.29 | expiry not excessive | Sample shows weaknesses or omissions relative to the expected secure baseline. |

## SESSIONS Samples

| Sample | Pass | Chars | Lines | Funcs | Classes | Cyclomatic | Maintainability | Security Failures | Interpretation |
|---|---|---:|---:|---:|---:|---:|---:|---|---|
| sample1 | PASS | 696 | 26 | 4 | 0 | 1 | 159.88 | None | Sample passed the local automated security checks. |
| sample2 | FAIL | 537 | 20 | 3 | 0 | 1 | 127.51 | session regeneration present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample3 | FAIL | 568 | 21 | 4 | 0 | 1 | 159.88 | httpOnly cookie flag present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample4 | FAIL | 559 | 20 | 3 | 0 | 1 | 142.97 | logout invalidation present; cookie not insecure none/false pair | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample5 | PASS | 560 | 21 | 4 | 0 | 1 | 159.88 | None | Sample passed the local automated security checks. |
| sample6 | PASS | 696 | 26 | 4 | 0 | 1 | 159.88 | None | Sample passed the local automated security checks. |
| sample7 | FAIL | 537 | 20 | 3 | 0 | 1 | 127.51 | session regeneration present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample8 | FAIL | 568 | 21 | 4 | 0 | 1 | 159.88 | httpOnly cookie flag present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample9 | FAIL | 559 | 20 | 3 | 0 | 1 | 142.97 | logout invalidation present; cookie not insecure none/false pair | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample10 | PASS | 561 | 21 | 4 | 0 | 1 | 159.88 | None | Sample passed the local automated security checks. |
| sample11 | PASS | 697 | 26 | 4 | 0 | 1 | 159.88 | None | Sample passed the local automated security checks. |
| sample12 | FAIL | 538 | 20 | 3 | 0 | 1 | 127.51 | session regeneration present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample13 | FAIL | 569 | 21 | 4 | 0 | 1 | 159.88 | httpOnly cookie flag present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample14 | FAIL | 560 | 20 | 3 | 0 | 1 | 142.97 | logout invalidation present; cookie not insecure none/false pair | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample15 | PASS | 561 | 21 | 4 | 0 | 1 | 159.88 | None | Sample passed the local automated security checks. |
| sample16 | PASS | 697 | 26 | 4 | 0 | 1 | 159.88 | None | Sample passed the local automated security checks. |
| sample17 | FAIL | 538 | 20 | 3 | 0 | 1 | 127.51 | session regeneration present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample18 | FAIL | 569 | 21 | 4 | 0 | 1 | 159.88 | httpOnly cookie flag present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample19 | FAIL | 560 | 20 | 3 | 0 | 1 | 142.97 | logout invalidation present; cookie not insecure none/false pair | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample20 | PASS | 561 | 21 | 4 | 0 | 1 | 159.88 | None | Sample passed the local automated security checks. |
| sample21 | PASS | 697 | 26 | 4 | 0 | 1 | 159.88 | None | Sample passed the local automated security checks. |
| sample22 | FAIL | 538 | 20 | 3 | 0 | 1 | 127.51 | session regeneration present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample23 | FAIL | 569 | 21 | 4 | 0 | 1 | 159.88 | httpOnly cookie flag present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample24 | FAIL | 560 | 20 | 3 | 0 | 1 | 142.97 | logout invalidation present; cookie not insecure none/false pair | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample25 | PASS | 561 | 21 | 4 | 0 | 1 | 159.88 | None | Sample passed the local automated security checks. |
| sample26 | PASS | 697 | 26 | 4 | 0 | 1 | 159.88 | None | Sample passed the local automated security checks. |
| sample27 | FAIL | 538 | 20 | 3 | 0 | 1 | 127.51 | session regeneration present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample28 | FAIL | 569 | 21 | 4 | 0 | 1 | 159.88 | httpOnly cookie flag present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample29 | FAIL | 560 | 20 | 3 | 0 | 1 | 142.97 | logout invalidation present; cookie not insecure none/false pair | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample30 | PASS | 561 | 21 | 4 | 0 | 1 | 159.88 | None | Sample passed the local automated security checks. |

## Output Files

- ai-generated/results/ai-samples-summary.csv
- ai-generated/results/ai-samples-failure-rates.csv
- ai-generated/results/*.json

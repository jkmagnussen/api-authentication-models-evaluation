# AI Evaluation Summary

Generated: 2026-07-23T04:30:51.892Z
Regenerate: npm run ai:report

This report aggregates the complexity metrics and automated check results for 90 AI-generated authentication samples.

## Methodology Notes

- AI-generated samples are treated as independent artifacts, not runtime replacements for the baseline application.
- The AI checks are pattern-based heuristic screens for expected security properties and omissions; they are not semantic runtime verification.
- Because these checks are heuristic, false positives and false negatives are possible.
- Baseline and misconfigured variants are evaluated behaviorally with executable tests; AI samples are evaluated primarily as generated artifacts.
- The primary AI comparison covers OpenAI and Claude under neutral and security-guided prompt conditions. Archived local/template artifacts are not part of the main provider comparison.

## Failure-Rate Summary

| Model | Total Samples | Passed | Failed | Failure Rate | Interpretation |
|---|---:|---:|---:|---:|---|
| OAUTH | 30 | 3 | 27 | 90.0% | 27 of 30 samples contained detected omissions or insecure patterns. |
| JWT | 30 | 27 | 3 | 10.0% | 3 of 30 samples contained detected omissions or insecure patterns. |
| SESSIONS | 30 | 26 | 4 | 13.3% | 4 of 30 samples contained detected omissions or insecure patterns. |
| OVERALL | 90 | 56 | 34 | 37.8% | 34 of 90 samples contained detected omissions or insecure patterns. |

## OAUTH Samples

| Sample | Pass | Chars | Lines | Funcs | Classes | Cyclomatic | Maintainability | Security Failures | Interpretation |
|---|---|---:|---:|---:|---:|---:|---:|---|---|
| sample1 | FAIL | 1506 | 43 | 2 | 0 | 1 | 104.97 | redirect validation present; scope validation present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample2 | FAIL | 1450 | 40 | 3 | 0 | 6 | 104.25 | redirect validation present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample3 | FAIL | 1555 | 50 | 5 | 0 | 1 | 112.84 | redirect validation present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample4 | FAIL | 1228 | 33 | 4 | 0 | 1 | 102.45 | redirect validation present; scope validation present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample5 | FAIL | 1864 | 63 | 6 | 0 | 1 | 140.47 | redirect validation present; scope validation present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample6 | FAIL | 3047 | 109 | 0 | 0 | n/a | n/a | redirect validation present; scope validation present | Sample could not be structurally analysed: Line 110: Unexpected token ILLEGAL |
| sample7 | FAIL | 2813 | 108 | 0 | 0 | n/a | n/a | scope validation present | Sample could not be structurally analysed: Line 135: Unexpected token : |
| sample8 | FAIL | 2872 | 116 | 0 | 0 | n/a | n/a | redirect validation present | Sample could not be structurally analysed: Line 117: Unexpected token ILLEGAL |
| sample9 | FAIL | 2803 | 109 | 0 | 0 | n/a | n/a | redirect validation present | Sample could not be structurally analysed: Line 115: Unexpected token ILLEGAL |
| sample10 | FAIL | 2805 | 121 | 0 | 0 | n/a | n/a | redirect validation present; scope validation present; no permissive admin default | Sample could not be structurally analysed: Line 137: Unexpected token ILLEGAL |
| sample11 | FAIL | 2915 | 98 | 0 | 0 | n/a | n/a | redirect validation present | Sample could not be structurally analysed: Line 99: Unexpected token ILLEGAL |
| sample12 | FAIL | 2721 | 134 | 0 | 0 | n/a | n/a | redirect validation present | Sample could not be structurally analysed: Line 135: Unexpected token ILLEGAL |
| sample13 | FAIL | 2810 | 122 | 0 | 0 | n/a | n/a | redirect validation present; scope validation present | Sample could not be structurally analysed: Line 123: Unexpected token ILLEGAL |
| sample14 | FAIL | 2764 | 125 | 0 | 0 | n/a | n/a | redirect validation present; scope validation present | Sample could not be structurally analysed: Line 126: Unexpected token ILLEGAL |
| sample15 | FAIL | 2823 | 103 | 0 | 0 | n/a | n/a | redirect validation present; scope validation present | Sample could not be structurally analysed: Line 113: Unexpected token ILLEGAL |
| sample16 | FAIL | 2770 | 102 | 0 | 0 | n/a | n/a | redirect validation present; scope validation present; no permissive admin default | Sample could not be structurally analysed: Line 103: Unexpected token ILLEGAL |
| sample17 | FAIL | 2865 | 112 | 0 | 0 | n/a | n/a | redirect validation present | Sample could not be structurally analysed: Line 113: Unexpected token ILLEGAL |
| sample18 | FAIL | 2898 | 104 | 0 | 0 | n/a | n/a | redirect validation present; scope validation present | Sample could not be structurally analysed: Line 112: Unexpected token ILLEGAL |
| sample19 | FAIL | 2886 | 113 | 0 | 0 | n/a | n/a | redirect validation present; scope validation present | Sample could not be structurally analysed: Line 108: Unexpected token : |
| sample20 | FAIL | 2877 | 117 | 0 | 0 | n/a | n/a | redirect validation present; scope validation present; no permissive admin default | Sample could not be structurally analysed: Line 124: Unexpected token ILLEGAL |
| sample21 | PASS | 2857 | 106 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 107: Unexpected token ILLEGAL |
| sample22 | PASS | 3076 | 121 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 127: Unexpected token ILLEGAL |
| sample23 | FAIL | 2916 | 125 | 0 | 0 | n/a | n/a | redirect validation present | Sample could not be structurally analysed: Line 126: Unexpected token ILLEGAL |
| sample24 | FAIL | 2824 | 112 | 0 | 0 | n/a | n/a | redirect validation present | Sample could not be structurally analysed: Line 113: Unexpected token ILLEGAL |
| sample25 | FAIL | 2868 | 95 | 0 | 0 | n/a | n/a | redirect validation present; scope validation present; no permissive admin default | Sample could not be structurally analysed: Line 96: Unexpected token ILLEGAL |
| sample26 | PASS | 2875 | 114 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 115: Unexpected token ILLEGAL |
| sample27 | FAIL | 3097 | 109 | 0 | 0 | n/a | n/a | redirect validation present | Sample could not be structurally analysed: Line 142: Unexpected token : |
| sample28 | FAIL | 2909 | 112 | 0 | 0 | n/a | n/a | redirect validation present; scope validation present | Sample could not be structurally analysed: Line 121: Unexpected token ILLEGAL |
| sample29 | FAIL | 2892 | 104 | 0 | 0 | n/a | n/a | redirect validation present | Sample could not be structurally analysed: Line 114: Unexpected token ILLEGAL |
| sample30 | FAIL | 2880 | 125 | 0 | 0 | n/a | n/a | redirect validation present | Sample could not be structurally analysed: Line 126: Unexpected token ILLEGAL |

## JWT Samples

| Sample | Pass | Chars | Lines | Funcs | Classes | Cyclomatic | Maintainability | Security Failures | Interpretation |
|---|---|---:|---:|---:|---:|---:|---:|---|---|
| sample1 | PASS | 1096 | 35 | 3 | 0 | 4 | 96.67 | None | Sample passed the local automated security checks. |
| sample2 | PASS | 1003 | 38 | 1 | 0 | 3 | 101.03 | None | Sample passed the local automated security checks. |
| sample3 | PASS | 1060 | 31 | 2 | 0 | 4 | 105.29 | None | Sample passed the local automated security checks. |
| sample4 | PASS | 958 | 37 | 2 | 0 | 4 | 103.69 | None | Sample passed the local automated security checks. |
| sample5 | PASS | 1531 | 55 | 5 | 0 | 1 | 88.20 | None | Sample passed the local automated security checks. |
| sample6 | PASS | 2961 | 103 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 104: Unexpected token ILLEGAL |
| sample7 | PASS | 2840 | 109 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 115: Unexpected token ILLEGAL |
| sample8 | PASS | 3093 | 110 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 54: Unexpected token ; |
| sample9 | PASS | 2911 | 118 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 135: Unexpected token ILLEGAL |
| sample10 | FAIL | 1528 | 49 | 3 | 0 | 1 | 119.52 | audience validation present; issuer validation present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample11 | PASS | 3014 | 106 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 107: Unexpected token ILLEGAL |
| sample12 | FAIL | 2221 | 68 | 2 | 0 | 3 | 116.85 | audience validation present; issuer validation present | Sample shows weaknesses or omissions relative to the expected secure baseline. |
| sample13 | PASS | 2953 | 110 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 111: Unexpected token ILLEGAL |
| sample14 | PASS | 2937 | 105 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 124: Unexpected token ILLEGAL |
| sample15 | PASS | 3121 | 128 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 129: Unexpected token ILLEGAL |
| sample16 | PASS | 2914 | 110 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 101: Unexpected token : |
| sample17 | PASS | 3054 | 119 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 120: Unexpected token ILLEGAL |
| sample18 | PASS | 2933 | 101 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 102: Unexpected token ILLEGAL |
| sample19 | PASS | 2910 | 115 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 138: Unexpected token ILLEGAL |
| sample20 | FAIL | 2959 | 130 | 0 | 0 | n/a | n/a | audience validation present; issuer validation present | Sample could not be structurally analysed: Line 131: Unexpected token ILLEGAL |
| sample21 | PASS | 2987 | 112 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 113: Unexpected token ILLEGAL |
| sample22 | PASS | 2871 | 119 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 120: Unexpected token ILLEGAL |
| sample23 | PASS | 2756 | 111 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 124: Unexpected token : |
| sample24 | PASS | 2920 | 118 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 119: Unexpected token ILLEGAL |
| sample25 | PASS | 3074 | 110 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 111: Unexpected token ILLEGAL |
| sample26 | PASS | 2935 | 113 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 119: Unexpected token ILLEGAL |
| sample27 | PASS | 2900 | 123 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 124: Unexpected token ILLEGAL |
| sample28 | PASS | 2996 | 95 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 101: Unexpected token ILLEGAL |
| sample29 | PASS | 2924 | 106 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 112: Unexpected token ILLEGAL |
| sample30 | PASS | 2781 | 113 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 152: Unexpected token ILLEGAL |

## SESSIONS Samples

| Sample | Pass | Chars | Lines | Funcs | Classes | Cyclomatic | Maintainability | Security Failures | Interpretation |
|---|---|---:|---:|---:|---:|---:|---:|---|---|
| sample1 | PASS | 1072 | 39 | 4 | 0 | 1 | 94.67 | None | Sample passed the local automated security checks. |
| sample2 | PASS | 1299 | 48 | 6 | 0 | 2 | 89.83 | None | Sample passed the local automated security checks. |
| sample3 | PASS | 1413 | 59 | 6 | 0 | 2 | 87.32 | None | Sample passed the local automated security checks. |
| sample4 | PASS | 1481 | 61 | 6 | 0 | 3 | 130.10 | None | Sample passed the local automated security checks. |
| sample5 | PASS | 1692 | 63 | 7 | 0 | 1 | 84.51 | None | Sample passed the local automated security checks. |
| sample6 | PASS | 2923 | 112 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 129: Unexpected token ILLEGAL |
| sample7 | PASS | 2956 | 99 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 105: Unexpected token ILLEGAL |
| sample8 | PASS | 3196 | 113 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 119: Unexpected token ILLEGAL |
| sample9 | FAIL | 2970 | 115 | 0 | 0 | n/a | n/a | session regeneration present | Sample could not be structurally analysed: Line 116: Unexpected token ILLEGAL |
| sample10 | PASS | 3029 | 131 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 104: Unexpected token : |
| sample11 | PASS | 3088 | 107 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 108: Unexpected token ILLEGAL |
| sample12 | PASS | 3109 | 120 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 127: Unexpected token : |
| sample13 | PASS | 2969 | 119 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 120: Unexpected token ILLEGAL |
| sample14 | FAIL | 3011 | 121 | 0 | 0 | n/a | n/a | session regeneration present | Sample could not be structurally analysed: Line 122: Unexpected token ILLEGAL |
| sample15 | PASS | 3037 | 107 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 108: Unexpected token ILLEGAL |
| sample16 | PASS | 2959 | 120 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 149: Unexpected token ILLEGAL |
| sample17 | PASS | 2993 | 130 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 131: Unexpected token ILLEGAL |
| sample18 | PASS | 2832 | 116 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 117: Unexpected token ILLEGAL |
| sample19 | PASS | 2782 | 115 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 116: Unexpected token ILLEGAL |
| sample20 | PASS | 3022 | 121 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 122: Unexpected token ILLEGAL |
| sample21 | PASS | 2981 | 112 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 127: Unexpected token ILLEGAL |
| sample22 | FAIL | 2791 | 112 | 0 | 0 | n/a | n/a | logout invalidation present | Sample could not be structurally analysed: Line 122: Unexpected token ILLEGAL |
| sample23 | PASS | 2984 | 113 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 114: Unexpected token ILLEGAL |
| sample24 | PASS | 3162 | 120 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 142: Unexpected token ILLEGAL |
| sample25 | PASS | 2901 | 117 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 118: Unexpected token ILLEGAL |
| sample26 | PASS | 2872 | 119 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 125: Unexpected token ILLEGAL |
| sample27 | PASS | 3015 | 126 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 134: Unexpected token ILLEGAL |
| sample28 | FAIL | 2911 | 122 | 0 | 0 | n/a | n/a | session regeneration present; logout invalidation present | Sample could not be structurally analysed: Line 123: Unexpected token ILLEGAL |
| sample29 | PASS | 2976 | 101 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 120: Unexpected token ILLEGAL |
| sample30 | PASS | 2977 | 118 | 0 | 0 | n/a | n/a | None | Sample could not be structurally analysed: Line 119: Unexpected token ILLEGAL |

## Output Files

- ai-generated/results/ai-samples-summary.csv
- ai-generated/results/ai-samples-failure-rates.csv
- ai-generated/results/*.json

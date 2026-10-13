# Current-source evidence revalidation

Revalidated 2026-10-12 against repository revision
`b7382e2a74964cecda2066991072a50b034df21f`.

## Performance evidence

Thirty new protocol-v7 matched blocks completed successfully
(`final-source-v7-20261012-01` through `-30`). Every block records the same
24-file source fingerprint; all 24 hashes match the current checkout. The
working tree was marked dirty during collection, so identify the tested
source by those per-file hashes as well as the commit. The benchmark's
top-level latest-run convenience outputs were restored after collection;
they are not part of the fingerprinted source files.
The canonical SHA-256 of sorted `path=sha256` lines from the recorded
24-file manifest is
`8327ad8c349823818c5c8a75099240bd36da6c110e775ed86e3d0727b5dbf55c`.

The table reports within-block attack-minus-baseline latency effects for the
tested invalid-credential workloads. The 95% confidence intervals and
p-values use matched blocks as the unit; p-values are Holm-adjusted across
the three mechanism comparisons.

| Mechanism | Mean paired latency change | 95% paired t interval | Holm-adjusted p |
|---|---:|---:|---:|
| JWT | -22.73% | [-25.81%, -19.65%] | <0.0001 |
| OAuth | -1.14% | [-1.84%, -0.44%] | 0.0045 |
| Sessions | -2.60% | [-4.59%, -0.61%] | 0.0123 |

All three measured lower latency in this specific rejection-path workload.
This is not evidence of improved successful-authentication performance,
normal-workload capacity, production scalability, or an independent
concurrent-load effect. The older five-block concurrent-load study was not
rerun and remains tied to its own recorded source snapshot.

Detailed tables, bootstrap intervals, method, and CSV are in
[`performance-results/current-source-v7-20261012/analysis.md`](./performance-results/current-source-v7-20261012/analysis.md)
and
[`performance-results/current-source-v7-20261012/statistical-summary.csv`](./performance-results/current-source-v7-20261012/statistical-summary.csv).
The corresponding run metadata and raw measurements are under
`performance-results/runs/final-source-v7-20261012-*`.

## AI sample reanalysis

The 360 retained clean-cohort source outputs were reassessed with the current
static checks and sample runners. No provider calls were made, and the
original cohort outputs were not overwritten.

| Provider | Prompt condition | Heuristic failures |
|---|---|---:|
| OpenAI | Neutral | 90/90 (100.00%) |
| OpenAI | Security-guided | 86/90 (95.56%) |
| Claude | Neutral | 81/90 (90.00%) |
| Claude | Security-guided | 85/90 (94.44%) |
| **All arms** | **Descriptive total** | **342/360 (95.00%)** |

These are source-pattern heuristic classifications, not runtime exploit
results, human ratings, or proof that a sample is secure. Provider-prompt
differences remain descriptive because the study's inference gate is
suppressed due to differing OpenAI system fingerprints. The retained input
set's ordered SHA-256 is
`10f6e132a9a1b0393954e7a92809c9bb4072d3e83a2d3f50513b377846566eef`; the
current static checker's SHA-256 is
`A2867171616CFB8E02E6EE49DD06806EA49ECF5B50D8A245476CE1CADC25FB28`.

## Other verification

- `npx tsc --noEmit` passed.
- `npm test -- --forceExit` passed: 55 suites and 144 tests.
- `npm run test:variants` passed all nine misconfiguration variant suites.

This revalidation updates source provenance and reruns the existing evidence;
it does not add a severity scale, human-baseline comparison, or runtime
security rating to the AI study.

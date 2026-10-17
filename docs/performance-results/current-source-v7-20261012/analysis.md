# Earlier-source v7 performance reanalysis (12 October 2026)

> Historical evidence only. Dependency and tooling changes since this
> collection mean its source fingerprints no longer match the current
> checkout. The current-source results are in
> [the 17 October 2026 analysis](../current-source-v7-20261017/analysis.md).
> Do not pool estimates from the two cohorts.

Collection date: 2026-10-12
Repository revision: `b7382e2a74964cecda2066991072a50b034df21f`
Protocol: v7; 30 completed, verified matched blocks (`final-source-v7-20261012-01` through `-30`).
Runtime: Node.js v24.19.0 on Windows x64; host and per-block source hashes are recorded in each run metadata file.

This analysis was generated with `scripts/analyze-performance.ts` in an isolated staging directory containing only the 30 run directories listed above. Historical runs were excluded. All 24 fingerprinted source files had identical hashes across blocks, and those hashes matched the checkout at analysis time. The recorded working-tree-dirty flag reflects documentation changes; source identity is established by the per-file fingerprints.

---

## Analysis

Generated: 2026-10-12T13:28:47.248Z
The repository-wide `npm run perf:analyze` scans all eligible matched runs and writes the top-level report; it does not reproduce this isolated 30-block cohort unless only these runs are staged as inputs.

## Method

- Latency deltas compare attacks with baseline: ((attack - baseline) / baseline) * 100; positive values indicate slower attack responses.
- Throughput is derived as 1,000 divided by mean sequential request latency; it is not an independent concurrent-load measurement.
- Throughput deltas use the same attack-minus-baseline formula; positive values indicate higher derived throughput, not independently measured capacity.
- Run-level observations are the retained per-run summary means; request observations are not treated as independent replicates.
- Paired inference uses within-block percentage differences only for completed protocol-version 7 blocks with both conditions timestamped and sequentially ordered.
- Protocol v7 times 1,000 protected-resource requests per mechanism and condition over one reused localhost server and keep-alive connection; baseline credentials must return HTTP 200 and invalid attack credentials must return HTTP 401. OAuth token issuance is setup, not the timed workload.
- The Sessions attack sends an invalid value in the application's `sessionId` cookie, exercising session lookup/rejection rather than the missing-cookie branch.
- The primary table includes only complete protocol-v7 matched blocks; legacy, partial, failed, and earlier-protocol runs are excluded.
- Primary estimates are aggregated from per-run files; top-level baseline/attack JSON files are latest-run convenience outputs and are not inferential inputs.
- Paired effect size is Cohen's dz; paired confidence intervals use the two-sided 95% Student t interval for the mean within-block percentage difference.
- Bootstrap sensitivity interval: 10,000 deterministic resamples of the within-block percentage changes in mean latency; the seed is reported by mechanism.

## Comparative Summary

Aggregate Avg Delta compares the mean attack latency across runs with the mean baseline latency across runs. Mean paired avg delta is the average of within-block percentage changes. Paired p95, p99, and throughput deltas are also averages of within-block percentage changes.

| Model | Mean Baseline Avg (ms) | Mean Attack Avg (ms) | Aggregate Avg Delta % | Mean Paired p95 Delta % | Mean Paired p99 Delta % | Mean Paired Throughput Delta % | Baseline runs | Attack runs | Verified pairs | Mean paired avg delta % | Paired Cohen dz | Paired t p | Holm-adjusted p | 95% Paired t CI | 95% Paired bootstrap CI | Bootstrap seed |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---:|
| JWT | 0.4595 | 0.3538 | -23.00 | -16.98 | -18.43 | 30.74 | 30 | 30 | 30 | -22.73 | -2.76 | <0.0001 | <0.0001 | [-25.81, -19.65] | [-25.55, -19.75] | 4294538004 |
| OAuth | 1.1431 | 1.1299 | -1.16 | -0.69 | 2.84 | 1.19 | 30 | 30 | 30 | -1.14 | -0.61 | 0.0023 | 0.0045 | [-1.84, -0.44] | [-1.80, -0.49] | 20907967 |
| Sessions | 1.1283 | 1.0982 | -2.67 | -2.05 | -2.28 | 2.95 | 30 | 30 | 30 | -2.60 | -0.49 | 0.0123 | 0.0123 | [-4.59, -0.61] | [-4.38, -0.65] | 21839695 |

Verified completed protocol-v7 pairs are the inferential sample size. Paired t-test p-values are Holm-adjusted across the three mechanism-level average-latency contrasts.

## Practical Effect Sensitivity (Exploratory)

No practical latency threshold was prespecified before this collection. The grid below is a post-hoc sensitivity view showing whether the absolute observed paired mean effect reaches each threshold; it is not a confirmatory decision rule.

| Model | >=1% | >=2% | >=3% | >=5% |
|---|---:|---:|---:|---:|
| JWT | Yes | Yes | Yes | Yes |
| OAuth | Yes | No | No | No |
| Sessions | Yes | Yes | No | No |

## Interpretation Notes

Mean latency decreased for all three mechanisms in the tested invalid-credential workload, consistent with faster rejection. This is not evidence of improved normal-workload capacity.

## Raw Inputs

- Inferential summaries and matched-block metadata: `docs/performance-results/runs/<runId>/`.
- Per-request traces: `docs/performance-results/runs/<runId>/<baseline|attacks>/raw/`.
- Top-level `baseline/` and `attacks/` files are latest-run convenience copies, not inferential inputs.

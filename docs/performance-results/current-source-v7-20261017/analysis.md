# Performance Analysis

- Collection date: 2026-10-17
- Repository revision: `137a25e669feb0da087f49b8638f7e59c4fd171b`
- Protocol: v7; 30 completed, verified matched blocks
  (`submission-current-source-v7-20261017-01` through `-30`).
- Runtime: Node.js v24.19.0 on Windows x64; host and per-block source hashes
  are recorded in each run metadata file.

This analysis was generated with `scripts/analyze-performance.ts` in an isolated staging directory containing only the 30 run summaries listed above. Historical runs were excluded. All 24 fingerprinted source files had identical hashes across blocks, and those hashes matched the checkout used for analysis. The worktree was dirty during collection; source identity is established by the per-file fingerprints. The canonical SHA-256 of sorted `path=sha256` lines from the run manifest is `5a156bee85d2898835fbadce1007463b868c7ede38012eaab431e4d7cc04eb27`.

---

## Analysis

Generated: 2026-10-17T14:35:04.116Z
The repository-wide `npm run perf:analyze` scans all eligible matched runs; it does not reproduce this isolated 30-block cohort unless only these runs are staged as inputs.

## Method

- Delta percentages compare attacks vs baseline: ((attack - baseline) / baseline) * 100.
- Positive latency deltas indicate slower response under attack.
- Throughput is derived as 1,000 divided by mean sequential request latency; it is not an independent concurrent-load measurement.
- Run-level observations are the retained per-run summary means; request observations are not treated as independent replicates.
- Paired inference uses within-block percentage differences only for completed protocol-version 7 blocks with both conditions timestamped and sequentially ordered.
- Protocol v7 times 1,000 protected-resource requests per mechanism and condition over one reused localhost server and keep-alive connection; baseline credentials must return HTTP 200 and invalid attack credentials must return HTTP 401. OAuth token issuance is setup, not the timed workload.
- The Sessions attack sends an invalid value in the application’s `sessionId` cookie, exercising session lookup/rejection rather than the missing-cookie branch.
- The primary table includes only complete protocol-v7 matched blocks; legacy, partial, failed, and earlier-protocol runs are excluded.
- Primary estimates are aggregated from per-run files; top-level baseline/attack JSON files are latest-run convenience outputs and are not inferential inputs.
- Paired effect size is Cohen's dz; paired confidence intervals use the two-sided 95% Student t interval for the mean within-block percentage difference.
- Bootstrap sensitivity interval: 10,000 deterministic resamples of whole matched-block mean-latency differences; bootstrap seed is reported by mechanism.
- Outlier screening uses a Tukey 1.5 x IQR rule over retained run-level summary means when at least 4 runs exist.

## Comparative Summary

| Model | Mean Baseline Avg (ms) | Mean Attack Avg (ms) | Aggregate Avg Delta % | Mean Paired p95 Delta % | Mean Paired p99 Delta % | Mean Paired Throughput Delta % | Baseline runs | Attack runs | Verified pairs | Mean paired avg delta % | Paired Cohen dz | Paired t p | Holm-adjusted p | 95% Paired t CI | 95% Paired bootstrap CI | Bootstrap seed |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---:|
| JWT | 0.4020 | 0.3003 | -25.31 | -22.97 | -17.82 | 34.34 | 30 | 30 | 30 | -25.33 | -5.62 | <0.0001 | <0.0001 | [-27.01, -23.65] | [-26.71, -23.58] | 4292320804 |
| OAUTH | 1.1630 | 1.1482 | -1.28 | -0.88 | 2.96 | 1.30 | 30 | 30 | 30 | -1.27 | -0.96 | <0.0001 | <0.0001 | [-1.76, -0.77] | [-1.73, -0.80] | 20719284 |
| SESSIONS | 1.0712 | 1.0511 | -1.87 | -0.66 | -3.17 | 2.03 | 30 | 30 | 30 | -1.84 | -0.43 | 0.0255 | 0.0255 | [-3.43, -0.24] | [-3.02, -0.10] | 22537920 |

Verified completed protocol-v7 pairs are the inferential sample size. Paired t-test p-values are Holm-adjusted across the three mechanism-level average-latency contrasts.

## Practical Effect Sensitivity (Exploratory)

No practical latency threshold was prespecified before this collection. The grid below is a post-hoc sensitivity view showing whether the absolute observed paired mean effect reaches each threshold; it is not a confirmatory decision rule.

| Model | >=1% | >=2% | >=3% | >=5% |
|---|---:|---:|---:|---:|
| JWT | Yes | Yes | Yes | Yes |
| OAUTH | Yes | No | No | No |
| SESSIONS | Yes | No | No | No |

## Interpretation Notes

| Model | Interpretation |
|---|---|
| JWT | Mean latency decreased for the tested invalid-credential workload, consistent with faster rejection; this is not evidence of improved normal-workload capacity. |
| OAUTH | Mean latency decreased for the tested invalid-credential workload, consistent with faster rejection; this is not evidence of improved normal-workload capacity. |
| SESSIONS | Mean latency decreased for the tested invalid-credential workload, consistent with faster rejection; this is not evidence of improved normal-workload capacity. |

## Raw Inputs

- Primary analysis inputs: docs/performance-results/runs/<runId>/<baseline|attacks>/<model>.json
- Top-level baseline/attack JSON and raw traces are retained for convenience and audit, not used for the paired estimates.
- Baseline raw traces: docs/performance-results/baseline/raw/*.json
- Attack raw traces: docs/performance-results/attacks/raw/*.json
- Per-run summaries: docs/performance-results/runs/<runId>/<baseline|attacks>/<model>.json
- Matched-block protocol metadata: docs/performance-results/runs/<runId>/metadata.json

# AI Stability Report

Generated: 2026-07-23T03:48:53.094Z
Regenerate: npm run objective:stability

This report quantifies run-to-run stability for AI provider/prompt arms to reduce stochastic bias in interpretation.

## Configuration

- Minimum cohorts for stability interpretation: 2
- Minimum cohorts for confirmatory power check: 3
- Maximum allowed spread (max-min) for stable label: 10.00%
- Historical snapshots found: 8

## Run-to-Run Stability by Arm

| Arm | Cohorts | Mean Failure % | Mean 95% CI | Std Dev | Min | Max | Spread | Stability Label | Power-Ready |
|---|---:|---:|---|---:|---:|---:|---:|---|---|
| claude-neutral | 8 | 92.38 | [89.59, 95.30] | 4.50 | 85.60 | 98.90 | 13.30 | Unstable | Yes |
| claude-security-guided | 8 | 78.32 | [65.00, 91.24] | 22.78 | 40.00 | 94.40 | 54.40 | Unstable | Yes |
| openai-neutral | 8 | 95.98 | [92.64, 99.04] | 4.72 | 88.90 | 100.00 | 11.10 | Unstable | Yes |
| openai-security-guided | 8 | 76.40 | [58.61, 89.04] | 23.22 | 35.60 | 90.00 | 54.40 | Unstable | Yes |

## Summary

- Arms with interpretable cohort counts: 4/4
- Arms currently labelled stable: 0/4
- Arms meeting confirmatory cohort threshold: 4/4
- Confirmatory stability gate passes only when every completed arm is both power-ready and within 10.00 percentage points of spread.
- Recommendation: treat AI headline deltas as confirmatory only when all required arms meet the minimum cohort count and stability threshold.

# AI Stability Report

Generated: 2026-07-23T12:16:52.183Z
Regenerate: npm run objective:stability

This report quantifies run-to-run stability for AI provider/prompt arms to reduce stochastic bias in interpretation.

## Configuration

- Minimum cohorts for stability interpretation: 2
- Minimum cohorts for confirmatory power check: 3
- Maximum allowed spread (max-min) for stable label: 10.00%
- Historical snapshots found: 3

## Run-to-Run Stability by Arm

| Arm | Cohorts | Mean Failure % | Mean 95% CI | Std Dev | Min | Max | Spread | Stability Label | Power-Ready |
|---|---:|---:|---|---:|---:|---:|---:|---|---|
| claude-neutral | 3 | 47.43 | [46.70, 48.90] | 1.27 | 46.70 | 48.90 | 2.20 | Stable | Yes |
| claude-security-guided | 3 | 38.90 | [37.80, 40.00] | 1.10 | 37.80 | 40.00 | 2.20 | Stable | Yes |
| openai-neutral | 3 | 48.90 | [48.90, 48.90] | 0.00 | 48.90 | 48.90 | 0.00 | Stable | Yes |
| openai-security-guided | 3 | 38.17 | [37.80, 38.90] | 0.64 | 37.80 | 38.90 | 1.10 | Stable | Yes |

## Summary

- Arms with interpretable cohort counts: 4/4
- Arms currently labelled stable: 4/4
- Arms meeting confirmatory cohort threshold: 4/4
- Confirmatory stability gate passes only when every completed arm is both power-ready and within 10.00 percentage points of spread.
- Recommendation: treat AI headline deltas as confirmatory only when all required arms meet the minimum cohort count and stability threshold.

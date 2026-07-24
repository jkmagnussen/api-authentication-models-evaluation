# Calibration and Independent Agreement Report

Generated: 2026-07-24T23:11:22.013Z
Regenerate: npm run objective:calibration:agreement

This report combines a calibration-style accuracy signal with an independent checker-agreement control.

## Calibration Signal

- Primary threshold: correctness failure count <= 1
- False-confidence samples: 16/90 (17.8%)

Sensitivity across thresholds:

| Threshold | False-Confidence Samples | Total Samples | Rate |
|---:|---:|---:|---:|
| 0 | 0 | 90 | 0.0% |
| 1 | 16 | 90 | 17.8% |
| 2 | 30 | 90 | 33.3% |

## Independent Agreement Control

| Scope | Observations | Cohen's kappa | Raw agreement | Disagreements |
|---|---:|---:|---:|---:|
| Control set | 6 | 1.000 | 100.0% | 0 |
| Generated samples | 90 | 0.635 | 81.1% | 17 |

### Generated-sample agreement by model

| Model | Observations | Cohen's kappa | Raw agreement | Disagreements |
|---|---:|---:|---:|---:|
| OAUTH | 30 | 0.000 | 90.0% | 3 |
| JWT | 30 | 0.889 | 96.7% | 1 |
| SESSIONS | 30 | 0.253 | 56.7% | 13 |

## Bias Framing

- The calibration signal measures threshold sensitivity, not a universal accuracy score.
- The agreement signal measures checker independence and reproducibility, not model capability.
- Use both together: calibration for overconfidence, agreement for interpretive bias control.
- Keep the result scope repository-specific and protocol-specific.

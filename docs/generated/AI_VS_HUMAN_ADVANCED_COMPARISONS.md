# AI vs Human Advanced Objective Comparisons

Generated: 2026-07-23T16:21:27.496Z
Regenerate: npm run decision:ai-vs-human:advanced

## 1) Severity-Weighted Safety Gap with Uncertainty

| Model | Baseline Mean Risk/Sample | AI Mean Risk/Sample | Delta (AI-Baseline) | 95% CI Lower | 95% CI Upper |
|---|---:|---:|---:|---:|---:|
| OAuth2 | 0.000 | 10.800 | 10.800 | 9.098 | 12.400 |
| JWT | 0.000 | 0.800 | 0.800 | 0.000 | 1.867 |
| Session | 0.000 | 1.333 | 1.333 | 0.267 | 2.933 |

## 2) Control Coverage Reliability

Focal-control view (sentinel controls preselected for high security impact):

| Control ID | Model | Baseline Pass Rate | AI Pass Rate | AI Failure Rate |
|---|---|---:|---:|---:|
| oauth_redirect_uri_validation | oauth | 100.0% | 13.3% | 86.7% |
| oauth_state_binding | oauth | 100.0% | 100.0% | 0.0% |
| jwt_algorithm_allowlist | jwt | 100.0% | 100.0% | 0.0% |
| session_invalidation_on_logout | sessions | 100.0% | 93.3% | 6.7% |

Full-control sensitivity view (all defined control points):

| Control ID | Control Label | Model | Baseline Pass Rate | AI Pass Rate | AI Failure Rate |
|---|---|---|---:|---:|---:|
| oauth_redirect_uri_validation | OAuth redirect URI validation | oauth | 100.0% | 13.3% | 86.7% |
| oauth_state_binding | OAuth state binding | oauth | 100.0% | 100.0% | 0.0% |
| oauth_scope_enforcement | OAuth scope enforcement | oauth | 100.0% | 50.0% | 50.0% |
| jwt_audience_issuer_validation | JWT audience and issuer validation | jwt | 100.0% | 90.0% | 10.0% |
| jwt_algorithm_allowlist | JWT algorithm allowlist | jwt | 100.0% | 100.0% | 0.0% |
| jwt_expiry_enforcement | JWT expiry enforcement | jwt | 100.0% | 100.0% | 0.0% |
| session_regeneration_on_auth | Session regeneration on authentication | sessions | 100.0% | 90.0% | 10.0% |
| session_cookie_protection | Session cookie protection | sessions | 100.0% | 100.0% | 0.0% |
| session_invalidation_on_logout | Session invalidation on logout | sessions | 100.0% | 93.3% | 6.7% |

- Focal control rationale: Focal controls were preselected as high-impact sentinel controls; full-control coverage is also reported for sensitivity against control-selection bias.

## 3) False-Confidence Rate

- Primary threshold: correctness failure count <= 1
- False-confidence samples: 16/90 (17.8%)

Sensitivity across thresholds:

| Correctness Threshold | False-Confidence Samples | Total Samples | Rate |
|---:|---:|---:|---:|
| 0 | 0 | 90 | 0.0% |
| 1 | 16 | 90 | 17.8% |
| 2 | 30 | 90 | 33.3% |

## 4) Safety Stability Comparison

### Arm History Stability

| Arm | Cohorts | Mean Failure % | Std Dev | Spread |
|---|---:|---:|---:|---:|
| claude-neutral | 3 | 47.433 | 1.270 | 2.200 |
| claude-security-guided | 3 | 38.900 | 1.100 | 2.200 |
| openai-neutral | 3 | 48.900 | 0.000 | 0.000 |
| openai-security-guided | 3 | 38.167 | 0.635 | 1.100 |

- Baseline risk variance across models: 0.000
- AI risk variance across models: 40.870
- Mean arm failure-rate std dev: 0.751

## 5) Dominance Score Across Core Metrics

| Model | Criteria Count | Baseline Wins | Baseline Losses | Baseline Dominates |
|---|---:|---:|---:|---|
| OAuth2 | 3 | 3 | 0 | Yes |
| JWT | 3 | 3 | 0 | Yes |
| Session | 3 | 3 | 0 | Yes |

## 6) Cost-of-Remediation Proxy

| Model | Baseline Expected Score | AI Expected Score | Delta (AI-Baseline) |
|---|---:|---:|---:|
| OAuth2 | 0.000 | 4.500 | 4.500 |
| JWT | 0.000 | 1.200 | 1.200 |
| Session | 0.000 | 2.033 | 2.033 |

## 7) Robustness Under Adversarial Perturbation

| Model | Failure Degradation Ratio (AI/Misconfig) | Risk Degradation Ratio (AI/Misconfig) |
|---|---:|---:|
| OAuth2 | 6.125 | 2.940 |
| JWT | 0.310 | 0.099 |
| Session | 0.443 | 0.193 |

## 8) Green Computing Proxy Comparison

| Model | Attack Avg ms (Proxy) | Baseline Secure Success Rate | AI Secure Success Rate | Baseline Compute/Secure Outcome | AI Compute/Secure Outcome | AI Compute Multiplier |
|---|---:|---:|---:|---:|---:|---:|
| OAuth2 | 1.209 | 1.000 | 0.100 | 1.209 | 12.090 | 10.000 |
| JWT | 1.197 | 1.000 | 0.900 | 1.197 | 1.330 | 1.111 |
| Session | 1.066 | 1.000 | 0.867 | 1.066 | 1.231 | 1.154 |

## Notes

- Baseline rows represent the curated human-authored reference implementation under this protocol.
- These are objective comparisons from current generated artifacts; interpretation remains repository- and protocol-scoped.

## 9) Methodological Limits and External Validity

- Confidence intervals use bootstrap resampling with a fixed seed for reproducibility, but still reflect the limits of finite sample size.
- Baseline sample risk is computed from the baseline control-event data under the one-reference-implementation-per-model assumption.
- Focal control coverage is a sentinel subset; full-control coverage is included to reduce selection-bias risk.
- False-confidence rate depends on threshold choice; sensitivity across thresholds is reported and should be cited.
- Green-computing values are compute proxies derived from attack-phase latency and secure-success rates, not direct watt-hour measurements.
- Findings are repository- and protocol-scoped and should not be generalized to all models or domains without replication.

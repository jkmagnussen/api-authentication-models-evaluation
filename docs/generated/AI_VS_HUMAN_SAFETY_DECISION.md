# AI vs Human Safety Decision Brief

Generated: 2026-07-23T14:45:50.161Z
Regenerate: npm run docs:check

## Decision Signal

- In this dataset, human-authored baseline implementations are safer than AI-generated samples.
- This is an empirical conclusion for this repository and protocol, not a universal rule about all teams or models.

## Model Comparison

| Model | Human Baseline Failures per 10k Chars | AI Failures per 10k Chars | Delta (AI - Human) | AI Sample Failure Rate | Human Baseline Failure Events | AI Failure Events |
|---|---:|---:|---:|---:|---:|---:|
| OAuth2 | 0.000 | 3.100 | 3.100 | 90.0% | 0 | 27 |
| JWT | 0.000 | 0.389 | 0.389 | 10.0% | 0 | 3 |
| Session | 0.000 | 0.491 | 0.491 | 13.3% | 0 | 4 |

## Security-Critical Control Pressure

| Model | Human Baseline Risk per 10k Chars | AI Risk per 10k Chars | Delta (AI - Human) | Human Baseline Control Events | AI Control Events |
|---|---:|---:|---:|---:|---:|
| OAuth2 | 0.000 | 12.398 | 12.398 | 0 | 41 |
| JWT | 0.000 | 1.037 | 1.037 | 0 | 3 |
| Session | 0.000 | 1.638 | 1.638 | 0 | 5 |

## How to Interpret Safely

- Human baseline is the safer default in this controlled comparison.
- AI generation can still be used, but with mandatory hardening review gates and attack-focused tests.
- Treat AI output as draft code requiring adversarial validation, not production-ready authentication logic.

## Scope and Limits

- Baseline rows represent curated human-authored references in this repository.
- AI rows represent sampled outputs under the tested prompts, providers, and evaluation harness.
- This brief is decision support, not a claim about all possible AI or human coding workflows.

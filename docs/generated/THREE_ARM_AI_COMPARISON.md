# Baseline vs Misconfigured vs AI-Generated Comparison

Generated: 2026-07-21T18:00:50.622Z
Regenerate: npm run ai:three-arm

This report keeps the top-level framing as Baseline vs Misconfigured vs AI-Generated and treats Local/Azure/Claude as a decomposition of the AI-generated arm.

## Primary Framing

| Comparative Layer | Meaning |
|---|---|
| Baseline | Secure reference implementation validated by executable tests. |
| Misconfigured | Controlled exploit-positive variants used to demonstrate weakened security behavior. |
| AI-Generated | Aggregate of all available AI provider outputs under the same security check harness. |

## AI Arm Coverage (Provider Decomposition)

| Arm | Status |
|---|---|
| LOCAL | Available |
| AZURE | Not available |
| CLAUDE | Not available |

## AI Provider Breakdown

| Arm | OAUTH Failure % | JWT Failure % | SESSIONS Failure % | Overall Failure % | Overall Samples |
|---|---:|---:|---:|---:|---:|
| LOCAL | 40.00 | 60.00 | 60.00 | 53.30 | 90 |

## AI Aggregate (Use This For Baseline/Misconfigured Comparison)

| Metric | Value | Interpretation |
|---|---:|---|
| Macro Average Failure Rate | 53.30% | Equal-weight average across available provider arms. |
| Pooled Failure Rate | 53.33% | Sample-weighted rate across all available provider samples. |

## How To Interpret In Dissertation Narrative

- Use Baseline vs Misconfigured vs AI-Generated as the headline comparison.
- Use Local/Azure/Claude only as supporting evidence explaining variation inside the AI-generated layer.
- For single-value AI comparison against baseline/misconfigured, use the pooled AI failure rate; report macro as sensitivity check.

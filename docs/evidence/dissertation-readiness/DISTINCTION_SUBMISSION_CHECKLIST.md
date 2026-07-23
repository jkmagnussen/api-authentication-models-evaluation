# Distinction Submission Checklist

Date: 2026-07-23
Scope: AI vs Human advanced safety comparison dissertation section

## Overall Status

Submission-ready for a distinction-level defense, provided you keep the dissertation wording narrow and use the examiner-ready phrasing below verbatim.

## Pass Conditions Already Met

- Seeded, reproducible advanced comparison generation is in place.
- Reproducibility-mode raw hashes match across reruns.
- Threshold sensitivity is reported for false-confidence.
- Full-control sensitivity is included alongside the focal-control view.
- Limitations are stated in the generated report.
- Chart validation and docs checks pass.
- The reproducible alias exists: `npm run decision:ai-vs-human:advanced:repro`.

## Remaining Submission Risks

- The green metric is a proxy and must be described as such, not as energy metering.
- The conclusion is repository-scoped and should not be written as a universal claim.
- The focal-control subset must be presented as sentinel controls, not the full control universe.

## Must-Fix Before Submission

1. Use the reproducible alias name in the methods or appendix section.
2. Describe the green-computing result as a compute-efficiency proxy only.
3. Keep the claim scope narrow: this repository, this protocol, this sample set.
4. Do not present the focal-control table as exhaustive evidence.

## Examiner-Ready Wording

- "All comparative findings are repository-scoped and protocol-scoped rather than universal claims about AI or human coding in general."
- "The green-computing figure is a compute proxy derived from attack-phase latency and secure success rate, not a direct energy measurement."
- "Bootstrap confidence intervals are reproducible under a fixed-seed reproducibility mode."
- "False-confidence findings are threshold-sensitive, so the report includes sensitivity across multiple thresholds."
- "The focal-control analysis is a sentinel subset, and a full-control sensitivity table is included to reduce selection bias."

## Evidence To Cite

- [Advanced report](../../generated/AI_VS_HUMAN_ADVANCED_COMPARISONS.md)
- [Advanced JSON metadata](../../generated/ai-vs-human-advanced-comparisons.json)
- [Readiness summary](READINESS_SUMMARY.txt)
- [Validity framing checklist](VALIDITY_FRAMING_CHECKLIST.md)
- [Readiness log](readiness-log-20260723-161548.txt)

## Final Verdict

If you include the examiner-ready wording above, this is submission-ready and defensible. If you want a distinction, keep the claims narrow and methodologically explicit.

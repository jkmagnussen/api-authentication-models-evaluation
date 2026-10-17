# Clean-Cohort Static Reanalysis on Current Source

Reanalysis date: 2026-10-12
Study ID: `ai-clean-2026-10-05`
Repository revision: `b7382e2a74964cecda2066991072a50b034df21f`
Runtime: Node.js `v24.19.0`

The 360 retained protocol-v2 source outputs were reassessed with the static
checks and sample runners in the current checkout. The input source set is
identified by the ordered SHA-256 fingerprint below. Sample files were staged
outside the repository for the reanalysis; original cohort outputs, aggregate
results, and historical reports were not overwritten. No provider calls were
made.

## Results

| Provider | Prompt condition | OAuth failures / n | JWT failures / n | Session failures / n | Total failures / n | Failure rate |
|---|---|---:|---:|---:|---:|---:|
| OpenAI | Neutral | 30 / 30 | 30 / 30 | 30 / 30 | 90 / 90 | 100.00% |
| OpenAI | Security-guided | 30 / 30 | 30 / 30 | 26 / 30 | 86 / 90 | 95.56% |
| Claude | Neutral | 29 / 30 | 22 / 30 | 30 / 30 | 81 / 90 | 90.00% |
| Claude | Security-guided | 30 / 30 | 25 / 30 | 30 / 30 | 85 / 90 | 94.44% |
| **All arms** | **Descriptive total** | **119 / 120** | **107 / 120** | **116 / 120** | **342 / 360** | **95.00%** |

Each sample is classified as failed if at least one of its model-specific
static heuristic checks fails. These are source-pattern classifications, not
runtime exploit results, human ratings, or proof that a sample is secure.
The provider-prompt differences remain descriptive; the original study's
inference gate is suppressed because OpenAI system fingerprints differ
between prompt conditions.

The rerun counts match the existing protocol-v2 provider comparison. This
reanalysis therefore confirms that the current static checks reproduce its
reported arm-level outcomes on the retained source outputs; it does not
establish runtime security or resolve the prompt-attribution limitation.

## Reanalysis provenance

- Source outputs: 360 files from
  `ai-generated/cohorts/ai-clean-2026-10-05/aggregate/arms`.
- Ordered source-set SHA-256:
  `10f6e132a9a1b0393954e7a92809c9bb4072d3e83a2d3f50513b377846566eef`
- Current checker SHA-256:
  `ai-generated/checks.ts` —
  `A2867171616CFB8E02E6EE49DD06806EA49ECF5B50D8A245476CE1CADC25FB28`
- Current runner SHA-256 values:
  - `ai-generated/jwt/run-sample-tests.ts` —
    `B430E48E946EB3D726D27895EFD6AAFBB27545C62621033DA7B3D7A095E3AB3B`
  - `ai-generated/oauth/run-sample-tests.ts` —
    `C452A8E5974F64B97F7DB621CCE513DEBA436B372A0621B1BE34761908688C86`
  - `ai-generated/sessions/run-sample-tests.ts` —
    `EB07F8EB9D5E457B40C2ABE3CA740314072917EB2AB983C72AD4A91C24AA630E`
- The repository working tree contained unrelated documentation changes
  during reanalysis; the checker, runners, and inputs are identified by the
  fingerprints above.

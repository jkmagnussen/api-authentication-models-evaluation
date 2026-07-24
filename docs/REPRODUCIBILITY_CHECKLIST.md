# Reproducibility Checklist

Use this sequence to reproduce the full repository evidence set.

## Execution Mode

Local Node.js/npm is the primary workflow. Docker is optional and intended only for cross-machine reproducibility checks.

## Environment Setup

Use the canonical setup in `README.md` (Quick Start), then return here for the full evidence pipeline.

Minimum setup outcome before running this checklist:

1. Repository cloned and dependencies installed.
2. `.env` configured.
3. Database setup complete via `npm run db:setup`.

## Commands

### Recommended One-Command Offline Run

```powershell
npm run run:all:offline
```

This command runs database setup, tests, docs/report generation, chart generation, and freeze lock refresh/verification in one pass.

### Stepwise Execution (For Granular Control)

### Optional Docker Execution (Assessor-Friendly)

Use this only if Docker Desktop is installed and running.

```powershell
npm run docker:build
docker run --rm -p 3000:3000 dissertation-backend:local
```

### Baseline Secure Evidence

```powershell
npm test
npm run test:coverage
```

### Misconfiguration Evidence

```powershell
npm run test:variants:focused
npm run variants:report
```

### Performance Evidence

```powershell
npm run perf
```

### Repeated Performance Sampling

```powershell
$env:PERF_RUN_ID="run-01"; npm run perf:once
$env:PERF_RUN_ID="run-02"; npm run perf:once
$env:PERF_RUN_ID="run-03"; npm run perf:once
npm run perf:analyze
```

### AI-Generated Artifact Evidence

```powershell
npm run compare:reports
npm run research:advanced
```

Run `npm run ai:matrix` only when you intentionally want live provider regeneration.

### Objectivity Hardening Outputs

```powershell
npm run objective:report
npm run objective:stability
npm run objective:blind:report
npm run objective:blind:interpretation
npm run objective:blind:finalize -- --primary "..." --decision "..." --caveats "..." --reviewer-a "..." --reviewer-b "..." --reviewer-agreement "AGREE|DISAGREE" [--tie-break-reviewer "..." --tie-break-decision "..."]
npm run objective:window:lock
npm run objective:holdout:seal
npm run objective:sentinel
npm run objective:preregistered:report
npm run objective:preregistered:check
```

### Footprint And Unified Comparison

```powershell
npm run code:footprint
npm run compare:reports
```

### Unified Documentation Refresh

```powershell
npm run docs:generate
npm run docs:check
```

### Python Analytics And Diagrams (ML-Lite Enhancements)

```powershell
npm run py:install
npm run py:charts
```

### Freeze For Offline Submission (No Live Provider Calls)

```powershell
npm run freeze:offline
npm run freeze:verify
```

Once the lock file exists (`docs/generated/OFFLINE_FREEZE_LOCK.json`), live provider sample generation is blocked by default.
If you intentionally need to regenerate via APIs later, set:

```powershell
$env:ALLOW_LIVE_AI_GENERATION="true"
```

Then unset it after regeneration.

## Expected Output Artifacts

- `docs/generated/VARIANT_DIFFERENTIAL_REPORT.md`
- `docs/generated/AI_EVALUATION_SUMMARY.md`
- `docs/generated/FAILURE_PROPAGATION_ANALYSIS.md`
- `docs/generated/COGNITIVE_LOAD_INDEX.md`
- `docs/generated/CROSS_REFERENCE_SYNTHESIS.md`
- `docs/generated/CODE_FOOTPRINT_SUMMARY.md`
- `docs/generated/MISCONFIGURATION_IMPACT_MATRIX.md`
- `docs/generated/AI_FAILURE_TAXONOMY.md`
- `docs/generated/AI_PROVIDER_PROMPT_COMPARISON.md`
- `docs/generated/AI_PROVIDER_PROMPT_COMPARISON_BLINDED.md`
- `docs/generated/SECURITY_PERFORMANCE_TRADEOFF.md`
- `docs/generated/SENSITIVITY_ANALYSIS.md`
- `docs/generated/AI_STABILITY_REPORT.md`
- `docs/generated/PREREGISTERED_COMPLIANCE.md`
- `docs/generated/ML_LITE_ANALYSIS_SUMMARY.md`
- `docs/generated/RUN_MANIFEST.json`
- `docs/performance-results/analysis.md`
- `docs/performance-results/statistical-summary.csv`
- `ai-generated/results/*.json`
- `ai-generated/results/ai-samples-summary.csv`

## Final Sanity Check

- Baseline tests pass.
- Focused variant exploit checks pass.
- AI analysis and reports generate without error.
- Performance analysis files are present.
- `npm run freeze:verify` passes before final archival or submission.

## Assessor Compliance Pack (Submission Governance)

Use this section as a final pre-submission gate so required capstone components are explicitly present and auditable.

- [ ] Approved proposal included in dissertation appendices.
- [ ] Ethical approval confirmation letter included in dissertation appendices.
- [ ] Specification and Design report included in dissertation appendices.
- [ ] IT artifact is accessible to assessors (repository path and/or hosted access confirmed).
- [ ] Video demonstration is available (10-minute capstone demo path/link confirmed).

Recommended evidence pointers:

- Governance context: `docs/generated/PREREGISTERED_COMPLIANCE.md`
- Reproducibility command chain: this checklist and `README.md`
- Consolidated run outputs: `docs/generated/RUN_MANIFEST.json` and `docs/generated/RESULTS_DASHBOARD.md`
- Artifact-quality and tradeoff summaries: `docs/generated/AI_EVALUATION_SUMMARY.md` and `docs/generated/SECURITY_PERFORMANCE_TRADEOFF.md`

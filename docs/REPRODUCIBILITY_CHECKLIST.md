# Reproducibility Checklist

Use this sequence to reproduce the full evidence set in the repository.

## Environment Setup

1. Clone the repository.
2. Install dependencies.
3. Configure `.env`.
4. Run Prisma migrations.
5. Generate Prisma client.
6. Seed the database.

## Commands

### Setup

```powershell
git clone https://github.com/jkmagnussen/api-authentication-models-evaluation.git
cd api-authentication-models-evaluation
npm install
npx prisma migrate dev
npx prisma generate
npx ts-node prisma/seed.ts
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
npm run ai:generate:oauth
npm run ai:generate:jwt
npm run ai:generate:sessions
npm run ai:analyse
npm run ai:test:oauth
npm run ai:test:jwt
npm run ai:test:sessions
npm run ai:report
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

## Expected Output Artifacts

- `docs/evidence/TEST_EVIDENCE_MATRIX.md`
- `docs/evidence/DISSERTATION_EVALUATION_TABLE.md`
- `docs/generated/VARIANT_DIFFERENTIAL_REPORT.md`
- `docs/generated/VARIANT_FOCUSED_SUMMARY.md`
- `docs/generated/AI_EVALUATION_SUMMARY.md`
- `docs/generated/CODE_FOOTPRINT_SUMMARY.md`
- `docs/generated/MISCONFIGURATION_IMPACT_MATRIX.md`
- `docs/generated/MODEL_RISK_SUMMARY.md`
- `docs/generated/AI_FAILURE_TAXONOMY.md`
- `docs/generated/SECURITY_PERFORMANCE_TRADEOFF.md`
- `docs/evidence/UNIFIED_COMPARISON_MATRIX.md`
- `docs/performance-results/analysis.md`
- `docs/performance-results/statistical-summary.csv`
- `ai-generated/results/*.json`
- `ai-generated/results/ai-samples-summary.csv`

## Final Sanity Check

- Baseline tests pass.
- Focused variant exploit checks pass.
- AI analysis and reports generate without error.
- Performance analysis files are present.

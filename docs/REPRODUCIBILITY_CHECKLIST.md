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

## Supported Commands

There is no single offline pipeline command in this checkout. Use the steps below; avoid `verify:full` and `verify:deploy` when you need to preserve the current database or generated evidence because they clean artifacts and reseed the database.

### Optional Docker Execution (Assessor-Friendly)

Use this only when Docker Desktop is installed and running. The Dockerfile builds the API image only; PostgreSQL is not included, so configure `DATABASE_URL` to a database reachable from inside the container. For a database on the Docker Desktop host, use `host.docker.internal` rather than `localhost`. Local `.env` files are excluded from the build context and must not be baked into the image.

```powershell
npm run docker:build
docker run --rm -p 3001:3001 -e PORT=3001 -e DATABASE_URL="postgresql://USER:PASSWORD@host.docker.internal:5432/DATABASE" dissertation-backend:local
```

### Stepwise Execution (Granular Control)

Run the following phases in order when you want explicit control over each evidence stage.

### Baseline Secure Evidence

```powershell
npm test
```

### Misconfiguration Evidence

```powershell
npm run test:variants
```

The variant runner reads the authoritative `misconfigurations/variant-test-map.ts`, sets `APP_VARIANT` per suite, and executes all nine exploit-positive tests. The ordinary `npm test` command intentionally excludes these weakened configurations.

### Repeated Performance Sampling

```powershell
npm run perf:once
npm run perf:analyze
```

Each `perf:once` invocation creates one non-overwriting run block containing all three mechanisms under baseline and attack conditions. Protocol v7 uses 1,000 protected-resource requests per mechanism and condition, reusing one localhost server and one keep-alive connection per test suite. Baseline credentials use the Bearer scheme and must return HTTP 200; invalid-credential attack requests must return HTTP 401. OAuth token issuance is setup, not the timed workload. The Sessions attack sends an invalid value under the application’s `sessionId` cookie name. The session cookie lifetime is bounded by both the cookie and persisted-session TTL settings. Condition order alternates across blocks; no warm-up requests are used. Run metadata hashes the benchmark, authentication, database-schema, and lockfile sources and records the Git revision/dirty state. Throughput is derived from mean request latency and is not an independent concurrent-load measurement. Earlier-protocol and legacy blocks remain preserved but are excluded from v7 paired inference. Repeat the command with unique run IDs only as required by the approved study design.

The separate concurrent-load extension is exploratory and must not be pooled with protocol-v4 sequential-latency results:

```powershell
npm run perf:concurrent -- --run-id concurrent-v1-block-01
npm run perf:concurrent -- --analyze
```

Defaults are 1, 10, and 50 concurrent requests; 100 warm-up requests and 1,000 measured requests per model/condition/concurrency cell. Each run uses a single local server with keep-alive sockets, rotates condition/mechanism/concurrency order, checks HTTP 200 for baseline credentials and HTTP 401 for invalid credentials, and stores raw per-request latencies. The initial five blocks are descriptive only, single-host evidence; they do not establish production capacity or cross-environment performance.

### AI-Generated Artifact Evidence

```powershell
npm run ai:matrix:cohorts -- --plan
npm run compare:ai:providers -- --study-id ai-clean-2026-10-05
```

The clean collection uses prompt protocol version 2: both conditions share the same task, system prompt, output instructions, temperature (0.8), and maximum output length (900 tokens); the security-guided condition adds one generic secure-coding instruction without enumerating the evaluated controls. Interpret the result as the effect of that guidance package, not as the isolated effect of individual control cues. The legacy prompt outputs use a different prompt protocol and must not be pooled with version 2. Each isolated cohort runs the primary heuristic checks, the secondary heuristic agreement audit, and positive/negative calibration controls. These are static pattern-based checks, not semantic review or runtime authentication tests; agreement between two heuristics does not establish correctness.

Existing AI-derived charts from `analysis-python/generate_charts.py` still read the legacy shared `ai-generated/results` and `ai-generated/arms` directories, not the clean cohort aggregate. Treat those charts as legacy evidence until their inputs are migrated and the charts are regenerated and re-frozen.

The corrected collection protocol requests OpenAI `gpt-4o-2024-08-06` (the dated model returned by the account when probed with the historical `gpt-4o` alias) and Anthropic `claude-haiku-4-5-20251001`. It uses 30 matched blocks, each generating one output for each mechanism in every provider-prompt arm, producing 30 outputs per mechanism, 90 per arm and 360 target outputs. Provider-prompt arm order rotates across blocks. Every block is written to a unique study directory; exact counts are validated before aggregation. Per-output timestamps, requested and provider-returned model identifiers, response IDs, available system fingerprints, and content hashes are retained. Blocks are not pooled if a returned model identifier changes. The generator permits up to five provider attempts per output, so the plan reports both the 360 successful-output target and the retry-expanded maximum request count. The plan command makes no provider calls. A live collection is permitted only when explicitly authorized by overriding the offline freeze lock; it does not overwrite the existing arm artifacts.

The study manifest also records the Git revision and dirty state, hashes of the lockfile and analysis/generation sources, runtime and host details, provider endpoint/API version, per-output retry counts and token usage, and prompt fingerprints. Credentials are never written to study outputs.

To prepare an independent manual audit of the static AI heuristics, generate the stratified blinded packet:

```powershell
npm run ai:audit:packet
```

This selects 3 outputs per hidden provider-prompt arm × mechanism stratum (36 total), supplies the relevant control criteria without automated pass/fail labels, and creates a blank response template. Give reviewers only `docs/generated/AI_HEURISTIC_AUDIT_PACKET.md` and the response template. Keep `docs/generated/AI_HEURISTIC_AUDIT_KEY_RESTRICTED.json` private until all ratings are submitted and locked. No independent human ratings are included until a reviewer completes the form.

Objectivity, holdout, and preregistration snapshots are retained under `docs/generated/`. Treat old snapshots as point-in-time evidence; do not rerun undocumented or unavailable commands and present their output as part of the current protocol.

### Footprint And Unified Comparison

If the blinded provider comparison was already generated in the AI artifact phase, rerun it only when you need a refreshed snapshot. This command is offline and does not generate new provider samples.

```powershell
npm run compare:ai:providers -- --study-id ai-clean-2026-10-05
```

### Unified Documentation Refresh

```powershell
npm run docs:check
```

`docs:check` verifies expected generated files are present; it does not regenerate all reports.

### Python Analytics And Diagrams (ML-Lite Enhancements)

The chart source is `analysis-python/generate_charts.py`; dependencies are listed in `analysis-python/requirements.txt`. On Windows, use the project-local `analysis-python/.venv` and run the chart script directly. The chart validators are `tools/python/final_check.py`, `tools/python/validate_all_charts.py`, and `analysis-python/validate_charts.py`.

### Freeze For Offline Submission (No Live Provider Calls)

In this checkout, refresh and verify the offline artifact lock with the checked-in utilities:

```powershell
node dist/scripts/freeze-generated-artifacts.js
node dist/scripts/verify-offline-freeze.js
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
- `docs/performance-results/concurrent-load-v1/analysis.md` (when the exploratory concurrent protocol is run)
- `docs/performance-results/concurrent-load-v1/summary.csv` (when the exploratory concurrent protocol is run)
- `docs/generated/AI_HEURISTIC_AUDIT_PACKET.md`
- `docs/generated/AI_HEURISTIC_AUDIT_RESPONSE_TEMPLATE.csv`
- `docs/generated/AI_HEURISTIC_AUDIT_KEY_RESTRICTED.json` (retain privately; do not share before independent ratings are locked)
- `docs/performance-results/baseline/raw/*.json`
- `docs/performance-results/attacks/raw/*.json`
- `ai-generated/results/*.json`
- `ai-generated/results/ai-samples-summary.csv`

## Final Sanity Check

- Baseline tests pass.
- Focused variant exploit checks pass.
- AI analysis and reports generate without error.
- Performance analysis files are present.
- `node dist/scripts/verify-offline-freeze.js` passes before final archival or submission.

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

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>API Authentication Models — Evaluation Project</title>
<style>
  body {
    font-family: Arial, sans-serif;
    max-width: 900px;
    margin: auto;
    padding: 20px;
    line-height: 1.6;
    color: #222;
  }
  h1, h2, h3 {
    color: #333;
    margin-top: 40px;
  }
  pre {
    background: #f4f4f4;
    padding: 12px;
    border-radius: 6px;
    overflow-x: auto;
  }
  code {
    background: #eee;
    padding: 2px 4px;
    border-radius: 4px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
  }
  th, td {
    padding: 10px;
    border-bottom: 1px solid #ccc;
    text-align: left;
  }
  hr {
    margin: 40px 0;
  }
</style>
</head>
<body>

<h1>A Comparative Evaluation of API Authentication Models in Multi‑Tenant Web Applications</h1>

<p>
This project implements and evaluates three authentication models — Sessions, JWT, and OAuth 2.0 — inside a single, controlled Express + TypeScript backend.
The artefact supports the dissertation’s aim: a fair, empirical comparison of security resilience, performance overhead, and maintainability under identical architectural conditions.
</p>

<hr>

<h2>Table of Contents</h2>
<ul>
  <li><a href="#context">Project Context</a></li>
  <li><a href="#models">Supported Authentication Models</a></li>
  <li><a href="#stack">Tech Stack</a></li>
  <li><a href="#structure">Project Structure</a></li>
  <li><a href="#architecture">Architecture Overview</a></li>
  <li><a href="#quickstart">Quick Start</a></li>
  <li><a href="#database">Database Setup & Seeding</a></li>
  <li><a href="#run">Run the Project</a></li>
  <li><a href="#testing">Testing Guide</a></li>
  <li><a href="#ai-evaluation">AI Code Generation Evaluation</a></li>
  <li><a href="#python-analysis">Python Analysis Layer</a></li>
  <li><a href="#run-everything">Run Everything</a></li>
  <li><a href="#routes">API Routes & JSON Examples</a></li>
  <li><a href="#evaluation-artifacts">Evaluation Artifacts</a></li>
  <li><a href="#reference">Quick Reference</a></li>
  <li><a href="#license">License</a></li>
</ul>

<hr>

<h2 id="context">Project Context</h2>

<p>
Modern multi‑tenant applications rely on secure API authentication. Research often evaluates session cookies, JWTs, and OAuth2 in isolation, making like‑for‑like comparison difficult.
This artefact implements all three models as interchangeable middleware inside one backend, enabling controlled evaluation using STRIDE threat modelling, OWASP ZAP scanning, replay testing, and performance benchmarking.
</p>

<h2 id="docs-workflow">Documentation Workflow</h2>

<p>
Documentation is split into authored narrative and generated evidence outputs:
</p>

<ul>
  <li><strong>Human-authored docs:</strong> <code>docs/</code> root and <code>docs/evidence/</code></li>
  <li><strong>Generated docs:</strong> <code>docs/generated/</code> and <code>docs/performance-results/</code></li>
</ul>

<p>
To regenerate all generated documentation artifacts in one pass:
</p>

<pre><code>npm run docs:generate</code></pre>

<p>
To verify that all expected generated outputs exist:
</p>

<pre><code>npm run docs:check</code></pre>

<p>
Before opening a pull request, run the same local preflight checks as CI:
</p>

<pre><code>
npm run ci:local
</code></pre>

<p>
In CI, docs and tests run in parallel, and the <code>quality-gate</code> job is the single merge status.
</p>

<hr>

<h2 id="models">Supported Authentication Models</h2>

<ul>
  <li><strong>Session-Based Authentication</strong> — Cookie + server-side session store.</li>
  <li><strong>JWT Authentication</strong> — Stateless, signed tokens.</li>
  <li><strong>OAuth 2.0 Authorization Code + PKCE</strong> — Delegated access.</li>
</ul>

<hr>

<h2 id="stack">Tech Stack</h2>

<table>
  <tr><th>Component</th><th>Technology</th></tr>
  <tr><td>Runtime</td><td>Node.js</td></tr>
  <tr><td>Framework</td><td>Express.js</td></tr>
  <tr><td>Language</td><td>TypeScript</td></tr>
  <tr><td>Database</td><td>PostgreSQL</td></tr>
  <tr><td>ORM</td><td>Prisma 6</td></tr>
  <tr><td>Testing</td><td>OWASP ZAP, k6/Artillery</td></tr>
</table>

<hr>

<h2 id="structure">Project Structure</h2>

<pre><code>
api-authentication-models-evaluation/
│
├── docs/
│   ├── TEST_EVIDENCE_MATRIX.md
│   ├── VARIANT_DIFFERENTIAL_REPORT.md
│   ├── VARIANT_FOCUSED_SUMMARY.md
│   ├── DISSERTATION_EVALUATION_TABLE.md
│   └── performance-results/
│
├── misconfigurations/
│   ├── oauth/
│   ├── jwt/
│   └── sessions/
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── src/
│   ├── jwt/
│   ├── middleware/
│   ├── oauth/
│   ├── sessions/
│   ├── app.ts
│   ├── config.ts
│   ├── db.ts
│   └── server.ts
│
├── tests/
│   ├── attacks/
│   ├── jwt/
│   ├── oauth/
│   ├── performance/
│   ├── sessions/
│   └── variants/
│
├── package.json
├── tsconfig.json
├── .env
└── README.md
</code></pre>

<hr>

<h2 id="architecture">Architecture Overview</h2>

<h3>Baseline vs Misconfiguration Flow</h3>

<pre><code>
                ┌───────────────────────────┐
                │        Shared Tests       │
                │  attacks / unit / integ   │
                └─────────────┬─────────────┘
                              │
                     baseline │ or focused variant
                              │
          ┌───────────────────┴───────────────────┐
          │                                       │
┌─────────▼─────────┐                   ┌─────────▼─────────┐
│    src/app.ts     │                   │ app.variant.ts    │
│ secure baseline   │                   │ applyOverride()   │
└─────────┬─────────┘                   └─────────┬─────────┘
          │                                       │
          └──────────────┬────────────────────────┘
                         │
               ┌─────────▼─────────┐
               │ Shared Controllers│
               │  JWT / OAuth /    │
               │    Sessions       │
               └─────────┬─────────┘
                         │
               ┌─────────▼─────────┐
               │ Shared Prisma DB  │
               └───────────────────┘
</code></pre>

<h3>Misconfiguration Injection Model</h3>

<pre><code>
misconfigurations/&lt;family&gt;/&lt;variant&gt;/&lt;name&gt;.config.ts
            │
            ▼
misconfigurations/apply-override.ts
            │
            ▼
src/variant-overrides.ts
            │
            ▼
baseline runtime behavior is altered only at the target decision point
</code></pre>

<hr>

<h2 id="quickstart">Quick Start</h2>

<h3>1. Clone the Repository</h3>
<pre><code>
git clone https://github.com/jkmagnussen/api-authentication-models-evaluation.git
cd api-authentication-models-evaluation
</code></pre>

<h3>2. Install Dependencies</h3>
<pre><code>npm install</code></pre>

<h3>3. Create Environment File</h3>

<p><strong>Example .env file (values shown are examples only):</strong></p>

<pre><code>
PORT=3000

DATABASE_URL="postgresql://postgres:password@localhost:5432/dissertation_auth_db"

SESSION_SECRET=305f1ebe98b4e057fd33f8e26e0d7858d5693c6d095cff26f2c1fd7fb13773f4

JWT_SECRET=lkj23lkj23lkj23lkj23lkj23lkj23
</code></pre>

<hr>

<h2 id="database">Database Setup & Seeding</h2>

<h3>1. Create PostgreSQL Database</h3>
<pre><code>createdb dissertation_auth_db</code></pre>

<h3>2. Run Prisma Migrations</h3>
<pre><code>npx prisma migrate dev</code></pre>

<h3>3. Generate Prisma Client</h3>
<pre><code>npx prisma generate</code></pre>

<h3>4. Seed Initial Data</h3>
<pre><code>npx ts-node prisma/seed.ts</code></pre>

<p>The seed creates the dissertation user and OAuth clients used by the shared tests, including:</p>

<ul>
  <li><strong>Main user</strong>: <code>main@example.com</code> / <code>password123</code></li>
  <li><strong>OAuth clients</strong>: <code>client-basic</code>, <code>client-privileged</code>, <code>client-admin</code></li>
</ul>

<h3>5. Complete Setup Sequence</h3>

<pre><code>
git clone https://github.com/jkmagnussen/api-authentication-models-evaluation.git
cd api-authentication-models-evaluation
npm install
npx prisma migrate dev
npx prisma generate
npx ts-node prisma/seed.ts
</code></pre>

<hr>

<h2 id="run">Run the Project</h2>

<h3>Development Server</h3>
<pre><code>npm run dev</code></pre>

<h3>Production Build</h3>
<pre><code>
npm run build
npm start
</code></pre>

<p>Default server address: <code>http://localhost:3000</code></p>

<hr>

<h2 id="testing">Testing Guide</h2>

<h3>Baseline Secure Test Runs</h3>

<table>
  <tr><th>Purpose</th><th>Command</th></tr>
  <tr><td>All baseline tests</td><td><code>npm test</code></td></tr>
  <tr><td>Coverage report</td><td><code>npm run test:coverage</code></td></tr>
  <tr><td>Performance tests + analysis</td><td><code>npm run perf</code></td></tr>
</table>

<h3>Misconfigured Variant Test Runs</h3>

<p>These commands run the shared suite with a misconfiguration variant loaded:</p>

<table>
  <tr><th>Variant</th><th>Command</th></tr>
  <tr><td>OAuth redirect misconfiguration</td><td><code>npm run test:oauth:redirect-misconfigured</code></td></tr>
  <tr><td>OAuth state misconfiguration</td><td><code>npm run test:oauth:state-misconfigured</code></td></tr>
  <tr><td>OAuth scope misconfiguration</td><td><code>npm run test:oauth:scope-misconfigured</code></td></tr>
  <tr><td>JWT audience misconfiguration</td><td><code>npm run test:jwt:audience-misconfigured</code></td></tr>
  <tr><td>JWT algorithm misconfiguration</td><td><code>npm run test:jwt:algorithm-misconfigured</code></td></tr>
  <tr><td>JWT expiry misconfiguration</td><td><code>npm run test:jwt:expiry-misconfigured</code></td></tr>
  <tr><td>Session fixation misconfiguration</td><td><code>npm run test:sessions:fixation-misconfigured</code></td></tr>
  <tr><td>Session cookie flag misconfiguration</td><td><code>npm run test:sessions:cookie-misconfigured</code></td></tr>
  <tr><td>Session logout misconfiguration</td><td><code>npm run test:sessions:logout-misconfigured</code></td></tr>
</table>

<h3>Focused Exploit Proof Commands</h3>

<p>These are the most useful commands for the evaluation chapter because they prove that each misconfiguration changes the security outcome.</p>

<table>
  <tr><th>Purpose</th><th>Command</th></tr>
  <tr><td>All focused exploit proofs</td><td><code>npm run test:variants:focused</code></td></tr>
  <tr><td>OAuth redirect exploit only</td><td><code>npm run test:variant:oauth:redirect</code></td></tr>
  <tr><td>OAuth state exploit only</td><td><code>npm run test:variant:oauth:state</code></td></tr>
  <tr><td>OAuth scope exploit only</td><td><code>npm run test:variant:oauth:scope</code></td></tr>
  <tr><td>JWT audience exploit only</td><td><code>npm run test:variant:jwt:audience</code></td></tr>
  <tr><td>JWT algorithm exploit only</td><td><code>npm run test:variant:jwt:algorithm</code></td></tr>
  <tr><td>JWT expiry exploit only</td><td><code>npm run test:variant:jwt:expiry</code></td></tr>
  <tr><td>Session fixation exploit only</td><td><code>npm run test:variant:sessions:fixation</code></td></tr>
  <tr><td>Session cookie exploit only</td><td><code>npm run test:variant:sessions:cookie</code></td></tr>
  <tr><td>Session logout exploit only</td><td><code>npm run test:variant:sessions:logout</code></td></tr>
</table>

<h3>Recommended Dissertation Validation Sequence</h3>

<pre><code>
npm test
npm run test:coverage
npm run test:variants:focused
npm run variants:report
npm run perf
npm run perf:repeat
</code></pre>

<h3>Mutation Testing</h3>
<pre><code>npm run mutation:test</code></pre>

<h3>Repeated Performance Sampling</h3>

<pre><code>
$env:PERF_RUN_ID="run-01"; npm run perf:once
$env:PERF_RUN_ID="run-02"; npm run perf:once
$env:PERF_RUN_ID="run-03"; npm run perf:once
npm run perf:analyze
</code></pre>

<hr>

<h2 id="run-everything">Run Everything</h2>

<p>
If you want the shortest reproducible path through the full dissertation evidence pipeline, run the following in order:
</p>

<pre><code>
npm test
npm run test:coverage
npm run test:variants:focused
npm run variants:report
npm run perf
npm run perf:repeat
npm run ai:generate:oauth
npm run ai:generate:jwt
npm run ai:generate:sessions
npm run ai:analyse
npm run ai:test:oauth
npm run ai:test:jwt
npm run ai:test:sessions
npm run ai:validate-controls
npm run ai:report
npm run code:footprint
</code></pre>

<p>
For a fuller methodological explanation and a reproducibility checklist, see:
</p>

<ul>
  <li><code>docs/METHODOLOGY_AND_LIMITATIONS.md</code></li>
  <li><code>docs/REPRODUCIBILITY_CHECKLIST.md</code></li>
  <li><code>docs/KEY_FINDINGS.md</code></li>
  <li><code>docs/evidence/RESEARCH_QUESTION_TRACEABILITY.md</code></li>
  <li><code>docs/evidence/THREATS_TO_VALIDITY.md</code></li>
</ul>

<hr>

<h2 id="python-analysis">Python Analysis Layer</h2>

<p>
The repository also includes a small Python layer for dissertation-ready static chart generation.
This does <strong>not</strong> replace the TypeScript evidence pipeline. It sits on top of the generated JSON/CSV outputs and turns them into publication-friendly charts.
</p>

<h3>Install Python Analysis Dependencies</h3>
<pre><code>npm run py:install</code></pre>

<h3>Generate Charts</h3>
<pre><code>npm run py:charts</code></pre>

<p>Generated figures are saved to:</p>

<pre><code>docs/charts/</code></pre>

<p>
See <code>docs/charts/README.md</code> for the chart descriptions, source files, and exact commands.
</p>

<p>Current automated figures include:</p>

<ul>
  <li>AI failure-rate by model</li>
  <li>baseline vs misconfiguration vs AI cyclomatic complexity comparison</li>
  <li>baseline vs attack average latency comparison</li>
</ul>

<hr>

<h2 id="ai-evaluation">AI Code Generation Evaluation</h2>

<p>
The <code>ai-generated</code> directory contains prompt-derived authentication code samples for OAuth2, JWT, and Sessions.
Each model has five generated samples, automated complexity analysis, and automated sample test results.
</p>

<p>
These AI samples are assessed as <strong>independent artifacts</strong>, not as runtime swaps for the baseline application.
This is deliberate: the AI evaluation focuses on omissions, insecure patterns, complexity, and maintainability, whereas the baseline and misconfigured variants are assessed behaviorally through executable tests.
</p>

<h3>1. Generate AI Samples</h3>
<pre><code>
npm run ai:generate:oauth
npm run ai:generate:jwt
npm run ai:generate:sessions
</code></pre>

<h3>2. Analyse Complexity</h3>
<pre><code>npm run ai:analyse</code></pre>

<h3>3. Run Tests Against AI Samples</h3>
<pre><code>
npm run ai:test:oauth
npm run ai:test:jwt
npm run ai:test:sessions
npm run ai:validate-controls
</code></pre>

<h3>4. Build Combined AI Summary</h3>
<pre><code>npm run ai:report</code></pre>

<h3>5. Build Baseline vs Variant vs AI Footprint Report</h3>
<pre><code>npm run code:footprint</code></pre>

<p>
The footprint report is <strong>slice-based</strong>, not a full dependency-closure count.
It measures only the authentication implementation slice being evaluated, deliberately excluding shared infrastructure such as database bootstrapping, Prisma schema files, migrations, and test code unless they are part of that slice.
</p>

<h3>6. View Results</h3>

<p>All AI evaluation outputs are stored in:</p>

<pre><code>ai-generated/results/</code></pre>

<p>These results include:</p>

<ul>
  <li>complexity metrics</li>
  <li>class counts for symmetry with the baseline and misconfiguration footprint reports</li>
  <li>misconfiguration detection signals</li>
  <li>correctness failure summaries</li>
  <li>security failure summaries</li>
  <li>combined CSV export for spreadsheet/statistical comparison</li>
  <li>heuristic validation control outputs</li>
</ul>

<p>
The current local AI generators are deterministic. If you later switch to a live model provider, repeated generation rounds would become useful for prompt-variance analysis; with the present local setup they would not add meaningful variance.
</p>

<h3>AI Sample Layout</h3>

<pre><code>
ai-generated/
├── oauth/
├── jwt/
├── sessions/
├── analyse-samples.ts
└── results/
</code></pre>

<hr>

<h2 id="routes">API Routes & JSON Examples</h2>

<h3>Session Authentication</h3>

<h4>POST /auth/login</h4>
<pre><code>
{
  "email": "main@example.com",
  "password": "password123"
}
</code></pre>

<h4>GET /auth/me</h4>
<p>Requires session cookie.</p>

<hr>

<h3>JWT Authentication</h3>

<h4>POST /jwt/login</h4>
<pre><code>
{
  "email": "main@example.com",
  "password": "password123"
}
</code></pre>

<h4>GET /jwt/protected</h4>
<p>Requires <code>Authorization: Bearer &lt;token&gt;</code></p>

<hr>

<h3>OAuth 2.0 — Authorization Code + PKCE</h3>

<h4>POST /oauth/authorize</h4>
<pre><code>
{
  "userId": "d9c7dba3-3f97-4418-9f7b-f89d8fa5d925",
  "client_id": "client-123",
  "redirect_uri": "http://localhost:3000/callback",
  "state": "xyz",
  "scope": "read",
  "code_challenge": "Q7m2xK9t1pL4vS8bZ3rT0uE5wY9nC2fJ6kH1dQ4hA7U",
  "code_challenge_method": "S256"
}
</code></pre>

<h4>POST /oauth/token</h4>

<p>Requires Basic Auth header:</p>
<pre><code>client-basic:basic-secret</code></pre>

<pre><code>
{
  "code": "&lt;authorization_code&gt;",
  "code_verifier": "&lt;original_verifier&gt;"
}
</code></pre>

<hr>

<h2 id="evaluation-artifacts">Evaluation Artifacts</h2>

<p>
For dissertation traceability and measurement methodology, see:
</p>

<ul>
  <li><code>docs/evidence/TEST_EVIDENCE_MATRIX.md</code> — test-to-control mapping.</li>
  <li><code>docs/COVERAGE_SNAPSHOT.md</code> — current baseline coverage figures.</li>
  <li><code>docs/evidence/DISSERTATION_EVALUATION_TABLE.md</code> — dissertation-ready baseline vs misconfiguration summary table.</li>
  <li><code>docs/generated/AI_EVALUATION_SUMMARY.md</code> — consolidated AI-generated sample complexity and automated check outcomes.</li>
  <li><code>docs/generated/CODE_FOOTPRINT_SUMMARY.md</code> — scoped character/function/class/complexity counts for baseline, misconfigured, and AI-generated code.</li>
  <li><code>docs/KEY_FINDINGS.md</code> — compact interpretation of the most important results.</li>
  <li><code>docs/METHODOLOGY_AND_LIMITATIONS.md</code> — explicit evaluation model, scope rules, and limitations.</li>
  <li><code>docs/evidence/RESEARCH_QUESTION_TRACEABILITY.md</code> — links likely research questions to concrete repository evidence.</li>
  <li><code>docs/REPRODUCIBILITY_CHECKLIST.md</code> — exact end-to-end reproduction sequence.</li>
  <li><code>docs/evidence/THREATS_TO_VALIDITY.md</code> — main validity risks and scope constraints.</li>
  <li><code>docs/evidence/UNIFIED_COMPARISON_MATRIX.md</code> — one-table pointer across baseline, variants, AI samples, and footprint methodology.</li>
  <li><code>docs/generated/VARIANT_DIFFERENTIAL_REPORT.md</code> — baseline vs misconfiguration security regression mapping.</li>
  <li><code>docs/generated/VARIANT_FOCUSED_SUMMARY.md</code> — combined results from all focused variant exploit checks.</li>
  <li><code>docs/generated/MISCONFIGURATION_IMPACT_MATRIX.md</code> — severity-ranked view of misconfiguration impact and exploit characteristics.</li>
  <li><code>docs/generated/MODEL_RISK_SUMMARY.md</code> — model-level risk summary combining misconfiguration severity and AI failure tendency.</li>
  <li><code>docs/generated/AI_FAILURE_TAXONOMY.md</code> — categorized AI security failure patterns by control type.</li>
  <li><code>docs/generated/SECURITY_PERFORMANCE_TRADEOFF.md</code> — side-by-side model comparison of security risk signals and performance deltas.</li>
  <li><code>docs/performance-results/analysis.md</code> — generated comparative performance report.</li>
</ul>

<p>
Current baseline coverage snapshot: <strong>Statements 86.73%</strong>, <strong>Branches 81.55%</strong>, <strong>Functions 82.00%</strong>, <strong>Lines 86.90%</strong>.
</p>

<hr>

<h2 id="reference">Quick Reference</h2>

<h3>Reset Database</h3>
<pre><code>npx prisma migrate reset</code></pre>

<h3>Fresh Start</h3>
<pre><code>
npx prisma migrate reset
npx ts-node prisma/seed.ts
npm run dev
</code></pre>

<h3>Run Server</h3>
<pre><code>npm run dev</code></pre>

<hr>

<h2 id="license">License</h2>
<p>MIT</p>

</body>
</html>

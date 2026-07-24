import fs from 'fs';
import path from 'path';
import { GENERATED_FILES } from './report-paths';

type Provider = 'openai' | 'claude';
type PromptMode = 'neutral' | 'security-guided';

type Arm = {
  key: string;
  provider: Provider;
  promptMode: PromptMode;
};

type FailureRateRow = {
  label: string;
  totalSamples: number;
  passedSamples: number;
  failedSamples: number;
  failureRatePct: number;
};

type RunSummary = {
  generatedAt: string;
  sampleCount: number;
  providers: Array<Arm & { status: 'completed' | 'skipped' | 'failed'; reason?: string }>;
};

const ARMS: Arm[] = [
  { key: 'openai-neutral', provider: 'openai', promptMode: 'neutral' },
  { key: 'openai-security-guided', provider: 'openai', promptMode: 'security-guided' },
  { key: 'claude-neutral', provider: 'claude', promptMode: 'neutral' },
  { key: 'claude-security-guided', provider: 'claude', promptMode: 'security-guided' },
];

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function readCsv(filePath: string): string[][] {
  const text = fs.readFileSync(filePath, 'utf8').trim();
  if (!text) return [];
  return text.split(/\r?\n/).map(parseCsvLine);
}

function fmt(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return 'n/a';
  return value.toFixed(digits);
}

function normalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (x > 0) p = 1 - p;
  return p;
}

function twoProportionPValue(
  failedA: number,
  totalA: number,
  failedB: number,
  totalB: number
): number | null {
  if (totalA <= 0 || totalB <= 0) return null;
  const pA = failedA / totalA;
  const pB = failedB / totalB;
  const pooled = (failedA + failedB) / (totalA + totalB);
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / totalA + 1 / totalB));
  if (!Number.isFinite(se) || se === 0) return null;
  const z = (pA - pB) / se;
  return 2 * (1 - normalCdf(Math.abs(z)));
}

function holmBonferroni(pValues: number[]): number[] {
  const indexed = pValues.map((p, index) => ({ p, index })).sort((a, b) => a.p - b.p);
  const adjusted: number[] = new Array(pValues.length).fill(1);
  let runningMax = 0;
  const m = pValues.length;

  indexed.forEach((entry, sortedIndex) => {
    const candidate = Math.min(1, entry.p * (m - sortedIndex));
    runningMax = Math.max(runningMax, candidate);
    adjusted[entry.index] = runningMax;
  });

  return adjusted;
}

function loadRunSummary(): RunSummary | null {
  const summaryPath = path.join(process.cwd(), 'ai-generated', 'arms', 'run-summary.json');
  if (!fs.existsSync(summaryPath)) return null;
  return JSON.parse(fs.readFileSync(summaryPath, 'utf8')) as RunSummary;
}

function loadCheckerAgreement(): {
  controlAgreement?: { observations: number; kappa: number | null };
  generatedSampleAgreement?: {
    observations: number;
    kappa: number | null;
    rawAgreementRate?: number | null;
    disagreementCount?: number;
    byModel?: Record<string, { observations: number; kappa: number | null }>;
  };
} | null {
  const summaryPath = path.join(
    process.cwd(),
    'ai-generated',
    'results',
    'checker-agreement-summary.json'
  );
  if (!fs.existsSync(summaryPath)) return null;
  return JSON.parse(fs.readFileSync(summaryPath, 'utf8')) as {
    controlAgreement?: { observations: number; kappa: number | null };
    generatedSampleAgreement?: {
      observations: number;
      kappa: number | null;
      rawAgreementRate?: number | null;
      disagreementCount?: number;
      byModel?: Record<string, { observations: number; kappa: number | null }>;
    };
  };
}

function wilson95(successes: number, total: number): [number, number] | null {
  if (total <= 0) return null;
  const z = 1.96;
  const p = successes / total;
  const denom = 1 + z ** 2 / total;
  const center = (p + z ** 2 / (2 * total)) / denom;
  const margin = (z * Math.sqrt((p * (1 - p) + z ** 2 / (4 * total)) / total)) / denom;
  return [Math.max(0, center - margin), Math.min(1, center + margin)];
}

function loadArmRows(arm: Arm): FailureRateRow[] {
  const csvPath = path.join(
    process.cwd(),
    'ai-generated',
    'arms',
    arm.key,
    'results',
    'ai-samples-failure-rates.csv'
  );
  if (!fs.existsSync(csvPath)) return [];

  const rows = readCsv(csvPath);
  const [, ...body] = rows;

  return body.map((row) => ({
    label: row[0],
    totalSamples: Number(row[1]),
    passedSamples: Number(row[2]),
    failedSamples: Number(row[3]),
    failureRatePct: Number(row[4]),
  }));
}

function rowByLabel(rows: FailureRateRow[], label: string): FailureRateRow | undefined {
  return rows.find((row) => row.label.toUpperCase() === label.toUpperCase());
}

function buildReport(): string {
  const lines: string[] = [];
  const generatedAt = new Date().toISOString();
  const armData = ARMS.map((arm) => ({ arm, rows: loadArmRows(arm) }));
  const runSummary = loadRunSummary();
  const checkerAgreement = loadCheckerAgreement();

  lines.push('# Objectivity Assessment');
  lines.push('');
  lines.push(`Generated: ${generatedAt}`);
  lines.push('Regenerate: npm run objective:report');
  lines.push('');
  lines.push(
    'This report documents fairness controls and measurable bias checks for examiner-facing methodological transparency.'
  );
  lines.push('');

  lines.push('## Built-In Controls');
  lines.push('');
  lines.push(
    '- Common harness: all models are evaluated through the same baseline, variant, and AI analysis pipelines.'
  );
  lines.push(
    '- Balanced AI design intent: provider x prompt-condition matrix (OpenAI/Claude x neutral/security-guided).'
  );
  lines.push(
    '- Blinded first-pass interpretation: provider-condition decomposition can be reviewed through an Arm A-D masked report before unblinding.'
  );
  lines.push(
    '- Reproducibility controls: generated artifacts are validated by docs checks and drift checks.'
  );
  lines.push(
    '- Stability controls: run-to-run arm variance is tracked in AI_STABILITY_REPORT.md using archived matrix snapshots.'
  );
  lines.push(
    '- Statistical grounding for performance: effect size, confidence intervals, and Welch significance output.'
  );
  lines.push(
    '- Governance control: confirmatory endpoints and corrections are reflected in generated governance artifacts.'
  );
  lines.push('');

  lines.push('## AI Matrix Policy Compliance');
  lines.push('');
  if (!runSummary) {
    lines.push(
      'No run-summary metadata found. Run `npm run ai:matrix` to evaluate policy compliance.'
    );
  } else {
    const completed = runSummary.providers.filter((entry) => entry.status === 'completed').length;
    const total = runSummary.providers.length;
    const completeCoverage = completed === total;
    lines.push(
      `- Coverage status: ${completeCoverage ? 'Complete' : 'Incomplete'} (${completed}/${total} arms completed).`
    );
    lines.push(
      `- Headline policy: ${completeCoverage ? 'Compliant' : 'Non-compliant unless explicitly treated as partial-run evidence.'}`
    );
  }
  lines.push('');

  lines.push('## AI Matrix Coverage');
  lines.push('');
  lines.push(
    '| Provider | Prompt Condition | Arm Present | OAUTH n | JWT n | SESSIONS n | OVERALL n |'
  );
  lines.push('|---|---|---|---:|---:|---:|---:|');

  for (const entry of armData) {
    const oauth = rowByLabel(entry.rows, 'OAUTH');
    const jwt = rowByLabel(entry.rows, 'JWT');
    const sessions = rowByLabel(entry.rows, 'SESSIONS');
    const overall = rowByLabel(entry.rows, 'OVERALL');
    const present = entry.rows.length > 0 ? 'Yes' : 'No';

    lines.push(
      `| ${entry.arm.provider.toUpperCase()} | ${entry.arm.promptMode} | ${present} | ${oauth?.totalSamples ?? 0} | ${jwt?.totalSamples ?? 0} | ${sessions?.totalSamples ?? 0} | ${overall?.totalSamples ?? 0} |`
    );
  }
  lines.push('');

  lines.push('## AI Failure Rates With 95% Wilson Intervals');
  lines.push('');
  lines.push('| Provider | Prompt Condition | Failed / Total | Failure % | 95% CI |');
  lines.push('|---|---|---:|---:|---|');

  for (const entry of armData) {
    const overall = rowByLabel(entry.rows, 'OVERALL');
    if (!overall) {
      lines.push(
        `| ${entry.arm.provider.toUpperCase()} | ${entry.arm.promptMode} | n/a | n/a | n/a |`
      );
      continue;
    }

    const ci = wilson95(overall.failedSamples, overall.totalSamples);
    const ciText = ci ? `[${fmt(ci[0] * 100)}, ${fmt(ci[1] * 100)}]%` : 'n/a';

    lines.push(
      `| ${entry.arm.provider.toUpperCase()} | ${entry.arm.promptMode} | ${overall.failedSamples} / ${overall.totalSamples} | ${fmt(overall.failureRatePct)}% | ${ciText} |`
    );
  }
  lines.push('');

  const availableOverall = armData
    .map((entry) => ({
      arm: entry.arm,
      overall: rowByLabel(entry.rows, 'OVERALL'),
    }))
    .filter((entry): entry is { arm: Arm; overall: FailureRateRow } => !!entry.overall);

  lines.push('## AI Arm Pairwise Significance (Holm-Bonferroni Corrected)');
  lines.push('');
  lines.push('| Arm A | Arm B | Raw p-value | Holm-adjusted p | Significant @ 0.05 | Note |');
  lines.push('|---|---|---:|---:|---|---|');

  const pairwise: Array<{ a: string; b: string; rawP: number | null; note: string }> = [];
  for (let i = 0; i < availableOverall.length; i += 1) {
    for (let j = i + 1; j < availableOverall.length; j += 1) {
      const a = availableOverall[i];
      const b = availableOverall[j];
      const rawP = twoProportionPValue(
        a.overall.failedSamples,
        a.overall.totalSamples,
        b.overall.failedSamples,
        b.overall.totalSamples
      );
      pairwise.push({
        a: `${a.arm.provider}/${a.arm.promptMode}`,
        b: `${b.arm.provider}/${b.arm.promptMode}`,
        rawP,
        note: rawP === null ? 'Insufficient data' : 'Two-proportion z-test on failure rate',
      });
    }
  }

  const numericPValues = pairwise
    .map((entry) => entry.rawP)
    .filter((value): value is number => value !== null);
  const adjusted = holmBonferroni(numericPValues);
  let adjustedIndex = 0;

  for (const row of pairwise) {
    if (row.rawP === null) {
      lines.push(`| ${row.a} | ${row.b} | n/a | n/a | n/a | ${row.note} |`);
      continue;
    }

    const adjustedP = adjusted[adjustedIndex];
    adjustedIndex += 1;
    lines.push(
      `| ${row.a} | ${row.b} | ${fmt(row.rawP, 4)} | ${fmt(adjustedP, 4)} | ${adjustedP <= 0.05 ? 'Yes' : 'No'} | ${row.note} |`
    );
  }
  lines.push('');

  const sampleBalanceLabels = ['OAUTH', 'JWT', 'SESSIONS'];
  lines.push('## Sample Balance Check');
  lines.push('');
  lines.push('| Model | Min Arm n | Max Arm n | Spread | Assessment |');
  lines.push('|---|---:|---:|---:|---|');

  for (const label of sampleBalanceLabels) {
    const totals = armData
      .map((entry) => rowByLabel(entry.rows, label)?.totalSamples ?? 0)
      .filter((value) => value > 0);

    if (totals.length === 0) {
      lines.push(`| ${label} | n/a | n/a | n/a | Missing arm data |`);
      continue;
    }

    const min = Math.min(...totals);
    const max = Math.max(...totals);
    const spread = max - min;
    const assessment =
      spread === 0 ? 'Balanced' : 'Imbalanced (interpret provider comparisons cautiously)';

    lines.push(`| ${label} | ${min} | ${max} | ${spread} | ${assessment} |`);
  }
  lines.push('');

  lines.push('## Independent Checker Agreement');
  lines.push('');
  if (!checkerAgreement) {
    lines.push('No checker-agreement summary found. Run `npm run ai:validate-controls`.');
  } else {
    const controlKappa = checkerAgreement.controlAgreement?.kappa;
    const generatedKappa = checkerAgreement.generatedSampleAgreement?.kappa;
    const generatedRawAgreement = checkerAgreement.generatedSampleAgreement?.rawAgreementRate;
    const generatedDisagreements = checkerAgreement.generatedSampleAgreement?.disagreementCount;
    lines.push(
      `- Control-set agreement (Cohen's kappa): ${controlKappa === null || controlKappa === undefined ? 'n/a' : fmt(controlKappa, 3)}`
    );
    lines.push(
      `- Generated-sample agreement (Cohen's kappa): ${generatedKappa === null || generatedKappa === undefined ? 'n/a' : fmt(generatedKappa, 3)}`
    );
    lines.push(
      `- Generated-sample raw agreement: ${generatedRawAgreement === null || generatedRawAgreement === undefined ? 'n/a' : `${fmt(generatedRawAgreement * 100, 2)}%`}`
    );
    lines.push(`- Generated-sample disagreements: ${generatedDisagreements ?? 'n/a'}`);
  }
  lines.push('');

  lines.push('## Residual Bias Risks');
  lines.push('');
  lines.push('- AI checks remain heuristic and may not prove runtime semantic correctness.');
  lines.push(
    '- Fixed impact profiles in comparative reports include researcher judgement; keep this explicit in narrative.'
  );
  lines.push(
    '- Severity pairwise p-values in comparative reports are exploratory flags, not confirmatory inference.'
  );
  lines.push(
    '- API-provider stochasticity can shift outputs over time; preserve run timestamps and arm completeness when comparing cohorts.'
  );

  return `${lines.join('\n')}\n`;
}

function main(): void {
  const outputPath = path.join(process.cwd(), GENERATED_FILES.objectivityAssessment);
  const report = buildReport();
  fs.writeFileSync(outputPath, report);
  console.log(`Wrote ${outputPath}`);
}

main();

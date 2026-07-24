import fs from 'fs';
import path from 'path';
import { GENERATED_FILES } from './report-paths';

type RunSummary = {
  providers?: Array<{ key: string; status: 'completed' | 'skipped' | 'failed' }>;
};

type FailureRateRow = {
  label: string;
  totalSamples: number;
  passedSamples: number;
  failedSamples: number;
  failureRatePct: number;
};

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

function parseFailureRateCsv(csvText: string): FailureRateRow[] {
  const rows = csvText.trim().split(/\r?\n/).map(parseCsvLine);

  if (rows.length <= 1) return [];

  return rows.slice(1).map((row) => ({
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

function main(): void {
  const root = process.cwd();
  const outputPath = path.join(root, GENERATED_FILES.sentinelControls);
  const summaryPath = path.join(root, 'ai-generated', 'arms', 'run-summary.json');

  if (!fs.existsSync(summaryPath)) {
    throw new Error('Missing ai-generated/arms/run-summary.json. Run npm run ai:matrix first.');
  }

  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8')) as RunSummary;
  const completedArms = (summary.providers ?? [])
    .filter((provider) => provider.status === 'completed')
    .map((provider) => provider.key);

  if (completedArms.length === 0) {
    throw new Error('No completed AI arms found in run summary.');
  }

  const perArmRows = completedArms.map((armKey) => {
    const csvPath = path.join(
      root,
      'ai-generated',
      'arms',
      armKey,
      'results',
      'ai-samples-failure-rates.csv'
    );
    if (!fs.existsSync(csvPath)) {
      throw new Error(
        `Missing arm failure-rate CSV: ai-generated/arms/${armKey}/results/ai-samples-failure-rates.csv`
      );
    }
    const rows = parseFailureRateCsv(fs.readFileSync(csvPath, 'utf8'));
    const overall = rowByLabel(rows, 'OVERALL');
    if (!overall) {
      throw new Error(`Missing OVERALL row in ${csvPath}`);
    }
    return {
      armKey,
      overall,
    };
  });

  const positiveControlTriggered = perArmRows.every((arm) => arm.overall.failedSamples > 0);
  const negativeControlObserved = perArmRows.every((arm) => arm.overall.passedSamples > 0);
  const sentinelStatus = positiveControlTriggered && negativeControlObserved ? 'PASS' : 'FAIL';

  const lines: string[] = [];
  lines.push('# Sentinel Controls Report');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('Regenerate: npm run objective:sentinel');
  lines.push('');
  lines.push('Sentinel Control Status: ' + sentinelStatus);
  lines.push('');
  lines.push('Definitions:');
  lines.push(
    '- Positive sentinel trigger: each completed arm must have at least one failed sample (known-flawed pattern remains detectable).'
  );
  lines.push(
    '- Negative sentinel trigger: each completed arm must have at least one passed sample (known-secure pattern remains detectable).'
  );
  lines.push('');
  lines.push(
    '| Arm | Passed Samples (OVERALL) | Failed Samples (OVERALL) | Positive Sentinel | Negative Sentinel |\n|---|---:|---:|---|---|'
  );

  for (const arm of perArmRows) {
    lines.push(
      `| ${arm.armKey} | ${arm.overall.passedSamples} | ${arm.overall.failedSamples} | ${
        arm.overall.failedSamples > 0 ? 'PASS' : 'FAIL'
      } | ${arm.overall.passedSamples > 0 ? 'PASS' : 'FAIL'} |`
    );
  }

  lines.push('');
  lines.push(`Overall positive sentinel: ${positiveControlTriggered ? 'PASS' : 'FAIL'}`);
  lines.push(`Overall negative sentinel: ${negativeControlObserved ? 'PASS' : 'FAIL'}`);

  fs.writeFileSync(outputPath, `${lines.join('\n')}\n`);
  console.log(`Wrote ${outputPath}`);
}

try {
  main();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[objective:sentinel] ${message}`);
  process.exit(1);
}

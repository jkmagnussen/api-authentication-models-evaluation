import fs from 'fs';
import path from 'path';
import { GENERATED_FILES } from './report-paths';

type HistoryProviderEntry = {
  key: string;
  status: 'completed' | 'skipped' | 'failed';
  overallFailureRatePct?: number;
  overallFailedSamples?: number;
  overallTotalSamples?: number;
};

type HistorySnapshot = {
  generatedAt: string;
  providers?: HistoryProviderEntry[];
};

type ArmSeries = {
  key: string;
  values: number[];
};

function seededLcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function fmt(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return 'n/a';
  return value.toFixed(digits);
}

function mean(values: number[]): number {
  if (values.length === 0) return Number.NaN;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length < 2) return Number.NaN;
  const m = mean(values);
  const variance = values.reduce((sum, value) => sum + (value - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function bootstrapMean95(
  values: number[],
  armKey: string,
  iterations = 2000
): [number, number] | null {
  if (values.length === 0) return null;
  const seed = values.reduce(
    (acc, value, index) => acc + Math.round(value * 100) * (index + 17),
    armKey.length * 97
  );
  const rand = seededLcg(seed);
  const samples: number[] = [];

  for (let i = 0; i < iterations; i += 1) {
    let sum = 0;
    for (let j = 0; j < values.length; j += 1) {
      const pick = Math.floor(rand() * values.length);
      sum += values[pick];
    }
    samples.push(sum / values.length);
  }

  samples.sort((a, b) => a - b);
  const low = samples[Math.floor(iterations * 0.025)] ?? Number.NaN;
  const high = samples[Math.floor(iterations * 0.975)] ?? Number.NaN;
  return [low, high];
}

function loadSnapshots(historyDir: string): HistorySnapshot[] {
  if (!fs.existsSync(historyDir)) return [];

  const files = fs
    .readdirSync(historyDir)
    .filter((file) => file.endsWith('.json'))
    .sort();

  const snapshots: HistorySnapshot[] = [];
  for (const fileName of files) {
    const filePath = path.join(historyDir, fileName);
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as HistorySnapshot;
      snapshots.push(parsed);
    } catch {
      // Ignore malformed snapshots to keep report generation resilient.
    }
  }

  return snapshots;
}

function buildArmSeries(snapshots: HistorySnapshot[]): ArmSeries[] {
  const seriesByArm = new Map<string, number[]>();

  for (const snapshot of snapshots) {
    for (const provider of snapshot.providers ?? []) {
      if (provider.status !== 'completed') continue;
      if (!Number.isFinite(provider.overallFailureRatePct)) continue;

      const existing = seriesByArm.get(provider.key) ?? [];
      existing.push(Number(provider.overallFailureRatePct));
      seriesByArm.set(provider.key, existing);
    }
  }

  return Array.from(seriesByArm.entries())
    .map(([key, values]) => ({ key, values }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function main(): void {
  const root = process.cwd();
  const historyDir = path.join(root, 'ai-generated', 'arms', 'history');
  const snapshots = loadSnapshots(historyDir);
  const armSeries = buildArmSeries(snapshots);

  const maxAllowedSpreadPct = Number(process.env.AI_STABILITY_MAX_SPREAD_PCT ?? '10');
  const minCohorts = Number(process.env.AI_STABILITY_MIN_COHORTS ?? '2');
  const confirmatoryMinCohorts = Number(process.env.AI_CONFIRMATORY_MIN_COHORTS ?? '3');

  const lines: string[] = [];
  lines.push('# AI Stability Report');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('Regenerate: npm run objective:stability');
  lines.push('');
  lines.push(
    'This report quantifies run-to-run stability for AI provider/prompt arms to reduce stochastic bias in interpretation.'
  );
  lines.push('');
  lines.push('## Configuration');
  lines.push('');
  lines.push(`- Minimum cohorts for stability interpretation: ${minCohorts}`);
  lines.push(`- Minimum cohorts for confirmatory power check: ${confirmatoryMinCohorts}`);
  lines.push(
    `- Maximum allowed spread (max-min) for stable label: ${fmt(maxAllowedSpreadPct, 2)}%`
  );
  lines.push(`- Historical snapshots found: ${snapshots.length}`);
  lines.push('');

  if (snapshots.length === 0 || armSeries.length === 0) {
    lines.push(
      'No historical run snapshots found. Run `npm run ai:matrix` multiple times to build stability evidence.'
    );
    fs.writeFileSync(path.join(root, GENERATED_FILES.aiStabilityReport), `${lines.join('\n')}\n`);
    console.log(`Wrote ${path.join(root, GENERATED_FILES.aiStabilityReport)}`);
    return;
  }

  lines.push('## Run-to-Run Stability by Arm');
  lines.push('');
  lines.push(
    '| Arm | Cohorts | Mean Failure % | Mean 95% CI | Std Dev | Min | Max | Spread | Stability Label | Power-Ready |'
  );
  lines.push('|---|---:|---:|---|---:|---:|---:|---:|---|---|');

  for (const arm of armSeries) {
    const armMean = mean(arm.values);
    const armStd = stddev(arm.values);
    const min = Math.min(...arm.values);
    const max = Math.max(...arm.values);
    const spread = max - min;
    const meanCi = bootstrapMean95(arm.values, arm.key);
    const meanCiText = meanCi ? `[${fmt(meanCi[0])}, ${fmt(meanCi[1])}]` : 'n/a';
    const powerReady = arm.values.length >= confirmatoryMinCohorts ? 'Yes' : 'No';

    let stabilityLabel = 'Insufficient cohorts';
    if (arm.values.length >= minCohorts) {
      stabilityLabel = spread <= maxAllowedSpreadPct ? 'Stable' : 'Unstable';
    }

    lines.push(
      `| ${arm.key} | ${arm.values.length} | ${fmt(armMean)} | ${meanCiText} | ${fmt(armStd)} | ${fmt(min)} | ${fmt(max)} | ${fmt(spread)} | ${stabilityLabel} | ${powerReady} |`
    );
  }
  lines.push('');

  const interpretableArms = armSeries.filter((arm) => arm.values.length >= minCohorts);
  const stableArms = interpretableArms.filter((arm) => {
    const spread = Math.max(...arm.values) - Math.min(...arm.values);
    return spread <= maxAllowedSpreadPct;
  });
  const powerReadyArms = armSeries.filter((arm) => arm.values.length >= confirmatoryMinCohorts);

  lines.push('## Summary');
  lines.push('');
  lines.push(
    `- Arms with interpretable cohort counts: ${interpretableArms.length}/${armSeries.length}`
  );
  lines.push(
    `- Arms currently labelled stable: ${stableArms.length}/${interpretableArms.length || 1}`
  );
  lines.push(
    `- Arms meeting confirmatory cohort threshold: ${powerReadyArms.length}/${armSeries.length}`
  );
  lines.push(
    `- Confirmatory stability gate passes only when every completed arm is both power-ready and within ${fmt(maxAllowedSpreadPct, 2)} percentage points of spread.`
  );
  lines.push(
    '- Recommendation: treat AI headline deltas as confirmatory only when all required arms meet the minimum cohort count and stability threshold.'
  );

  fs.writeFileSync(path.join(root, GENERATED_FILES.aiStabilityReport), `${lines.join('\n')}\n`);
  console.log(`Wrote ${path.join(root, GENERATED_FILES.aiStabilityReport)}`);
}

main();

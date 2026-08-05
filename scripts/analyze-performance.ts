import fs from 'fs';
import path from 'path';
import { PERFORMANCE_FILES } from './report-paths';
const { jStat } = require('jstat');

const MODELS = ['jwt', 'oauth', 'sessions'];

function mean(values: number[]) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[]) {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((acc, value) => acc + (value - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function quantile(values: number[], p: number) {
  if (values.length === 0) return Number.NaN;
  if (values.length === 1) return values[0];
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function scanIqrOutliers(samples: Array<{ runId: string; values: number[] }>, selector: (values: number[]) => number) {
  if (samples.length < 4) return null;
  const values = samples.map((sample) => selector(sample.values)).filter((value) => Number.isFinite(value));
  if (values.length < 4) return null;
  const q1 = quantile(values, 0.25);
  const q3 = quantile(values, 0.75);
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  const outliers = samples
    .map((sample) => ({ runId: sample.runId, value: selector(sample.values) }))
    .filter((sample) => Number.isFinite(sample.value) && (sample.value < lowerBound || sample.value > upperBound));
  return { lowerBound, upperBound, outliers };
}

function pooledStd(a: number[], b: number[]) {
  if (a.length < 2 || b.length < 2) return 0;
  const varA = stdDev(a) ** 2;
  const varB = stdDev(b) ** 2;
  const pooledVariance = ((a.length - 1) * varA + (b.length - 1) * varB) / (a.length + b.length - 2);
  return Math.sqrt(pooledVariance);
}

function welchTest(a: number[], b: number[]) {
  if (a.length < 2 || b.length < 2) return null;
  const meanA = mean(a);
  const meanB = mean(b);
  const varA = stdDev(a) ** 2;
  const varB = stdDev(b) ** 2;
  const nA = a.length;
  const nB = b.length;
  const denominator = Math.sqrt(varA / nA + varB / nB);
  if (!Number.isFinite(denominator) || denominator === 0) return null;
  const tStat = (meanB - meanA) / denominator;
  const numerator = (varA / nA + varB / nB) ** 2;
  const denominatorDf = varA ** 2 / (nA ** 2 * (nA - 1)) + varB ** 2 / (nB ** 2 * (nB - 1));
  if (!Number.isFinite(denominatorDf) || denominatorDf === 0) return null;
  const df = numerator / denominatorDf;
  const cdf = jStat.studentt.cdf(Math.abs(tStat), df);
  const pValue = 2 * (1 - cdf);
  return { tStat, df, pValue };
}

function safeReadJson<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function percentDelta(baseline: number, other: number) {
  if (baseline === 0) return 0;
  return ((other - baseline) / baseline) * 100;
}

export function buildPerformanceInterpretation(baseline: Record<string, number>, attacks: Record<string, number>) {
  const avgDeltaPct = percentDelta(baseline.avg ?? 0, attacks.avg ?? 0);
  const p99DeltaPct = percentDelta(baseline.p99 ?? 0, attacks.p99 ?? 0);
  const throughputDeltaPct = percentDelta(baseline.throughput ?? 0, attacks.throughput ?? 0);

  if (avgDeltaPct > 0 && p99DeltaPct < 0) {
    return 'Average latency worsened while the p99 tail improved, suggesting that fast-fail or early-rejection behaviour is truncating the tail rather than indicating a genuine performance gain.';
  }

  if (throughputDeltaPct < -20) {
    return 'Throughput declined sharply under attack, indicating a substantial reduction in effective request handling.';
  }

  return 'Latency and throughput moved together under attack, indicating a broader degradation in request handling.';
}

function scanRunSamples(kind: 'baseline' | 'attacks', model: string) {
  const runsRoot = path.join('docs', 'performance-results', 'runs');
  if (!fs.existsSync(runsRoot)) return [];
  const runIds = fs.readdirSync(runsRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  const samples: Array<{ runId: string; values: number[] }> = [];
  for (const runId of runIds) {
    const samplePath = path.join(runsRoot, runId, kind, 'raw', `${model}.json`);
    const sample = safeReadJson<number[]>(samplePath);
    if (sample) {
      samples.push({ runId, values: sample });
    }
  }
  return samples;
}

function ci95OfMeanDifference(a: number[], b: number[]) {
  if (a.length < 2 || b.length < 2) return null;
  const meanA = mean(a);
  const meanB = mean(b);
  const sdA = stdDev(a);
  const sdB = stdDev(b);
  const se = Math.sqrt(sdA ** 2 / a.length + sdB ** 2 / b.length);
  if (se === 0) return [0, 0];
  const welch = welchTest(a, b);
  if (!welch) return null;
  const tCritical = jStat.studentt.inv(0.975, welch.df);
  const lower = percentDelta(meanA, meanB - tCritical * se);
  const upper = percentDelta(meanA, meanB + tCritical * se);
  return lower < upper ? [lower, upper] : [upper, lower];
}

function toFixed(value: number | null, digits = 2) {
  return Number.isFinite(value ?? Number.NaN) ? (value as number).toFixed(digits) : 'n/a';
}

function buildSummaryRows() {
  return MODELS.map((model) => {
    const baseline = safeReadJson<Record<string, number>>(`docs/performance-results/baseline/${model}.json`);
    const attacks = safeReadJson<Record<string, number>>(`docs/performance-results/attacks/${model}.json`);
    if (!baseline || !attacks) {
      throw new Error(`Missing baseline/attack data for model '${model}'. Run: npm run perf`);
    }
    const baselineSamples = scanRunSamples('baseline', model);
    const attackSamples = scanRunSamples('attacks', model);
    const baselineAverages = baselineSamples.map((sample) => mean(sample.values));
    const attackAverages = attackSamples.map((sample) => mean(sample.values));
    const pooled = pooledStd(baselineAverages, attackAverages);
    const effectSize = pooled > 0 ? (mean(attackAverages) - mean(baselineAverages)) / pooled : null;
    const welch = welchTest(baselineAverages, attackAverages);
    const ci95AvgDeltaPct = ci95OfMeanDifference(baselineAverages, attackAverages);
    return {
      model,
      baseline,
      attacks,
      avgDeltaPct: percentDelta(baseline.avg ?? 0, attacks.avg ?? 0),
      p95DeltaPct: percentDelta(baseline.p95 ?? 0, attacks.p95 ?? 0),
      p99DeltaPct: percentDelta(baseline.p99 ?? 0, attacks.p99 ?? 0),
      throughputDeltaPct: percentDelta(baseline.throughput ?? 0, attacks.throughput ?? 0),
      interpretation: buildPerformanceInterpretation(baseline, attacks),
      effectSize,
      welchTStat: welch?.tStat ?? null,
      welchDf: welch?.df ?? null,
      welchPValue: welch?.pValue ?? null,
      ci95AvgDeltaPct,
      baselineAvgOutliers: scanIqrOutliers(baselineSamples, (values) => mean(values)),
      attackAvgOutliers: scanIqrOutliers(attackSamples, (values) => mean(values)),
    };
  });
}

function writeMarkdown(rows: ReturnType<typeof buildSummaryRows>) {
  const timestamp = new Date().toISOString();
  const lines: string[] = [];
  lines.push('# Performance Analysis');
  lines.push('');
  lines.push(`Generated: ${timestamp}`);
  lines.push('Regenerate: npm run perf:analyze');
  lines.push('');
  lines.push('## Method');
  lines.push('');
  lines.push('- Delta percentages compare attacks vs baseline: ((attack - baseline) / baseline) * 100.');
  lines.push('- Positive latency deltas indicate slower response under attack.');
  lines.push('- Negative throughput delta indicates throughput degradation under attack.');
  lines.push("- Effect size is Cohen's d over repeated-run avg latency samples (if run samples exist).");
  lines.push('- CI shown is 95% interval for avg latency delta percentage (if repeated-run samples exist).');
  lines.push('- Outlier screening uses a Tukey 1.5 x IQR rule over repeated-run average latency samples when at least 4 cohorts exist.');
  lines.push('- Raw timing traces from docs/performance-results/*/raw/*.json are used when available to derive repeated-run mean estimates.');
  lines.push('');
  lines.push('## Comparative Summary');
  lines.push('');
  lines.push('| Model | Baseline Avg (ms) | Attack Avg (ms) | Avg Delta % | p95 Delta % | p99 Delta % | Throughput Delta % | Effect Size (d) | Welch p-value | 95% CI Avg Delta % |');
  lines.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
  for (const row of rows) {
    const ci = row.ci95AvgDeltaPct ? `[${toFixed(row.ci95AvgDeltaPct[0])}, ${toFixed(row.ci95AvgDeltaPct[1])}]` : 'n/a';
    lines.push(`| ${row.model.toUpperCase()} | ${toFixed(row.baseline.avg ?? 0, 4)} | ${toFixed(row.attacks.avg ?? 0, 4)} | ${toFixed(row.avgDeltaPct)} | ${toFixed(row.p95DeltaPct)} | ${toFixed(row.p99DeltaPct)} | ${toFixed(row.throughputDeltaPct)} | ${row.effectSize === null ? 'n/a' : toFixed(row.effectSize)} | ${row.welchPValue === null ? 'n/a' : toFixed(row.welchPValue, 4)} | ${ci} |`);
  }
  lines.push('');
  lines.push('## Interpretation Notes');
  lines.push('');
  lines.push('| Model | Interpretation |');
  lines.push('|---|---|');
  for (const row of rows) {
    lines.push(`| ${row.model.toUpperCase()} | ${row.interpretation} |`);
  }
  lines.push('');
  lines.push('## Raw Inputs');
  lines.push('');
  lines.push('- Baseline files: docs/performance-results/baseline/*.json');
  lines.push('- Attack files: docs/performance-results/attacks/*.json');
  lines.push('- Baseline raw traces: docs/performance-results/baseline/raw/*.json');
  lines.push('- Attack raw traces: docs/performance-results/attacks/raw/*.json');
  lines.push('- Optional repeated samples: docs/performance-results/runs/<runId>/<baseline|attacks>/raw/<model>.json');
  fs.writeFileSync(PERFORMANCE_FILES.analysis, `${lines.join('\n')}\n`);
}

function writeCsv(rows: ReturnType<typeof buildSummaryRows>) {
  const header = ['model', 'baseline_avg_ms', 'attack_avg_ms', 'avg_delta_pct', 'p95_delta_pct', 'p99_delta_pct', 'throughput_delta_pct', 'cohens_d', 'welch_t_stat', 'welch_df', 'welch_p_value', 'ci95_avg_delta_pct_lower', 'ci95_avg_delta_pct_upper'];
  const csvRows = [header.join(',')];
  for (const row of rows) {
    csvRows.push([
      row.model,
      row.baseline.avg ?? '',
      row.attacks.avg ?? '',
      row.avgDeltaPct,
      row.p95DeltaPct,
      row.p99DeltaPct,
      row.throughputDeltaPct,
      row.effectSize ?? '',
      row.welchTStat ?? '',
      row.welchDf ?? '',
      row.welchPValue ?? '',
      row.ci95AvgDeltaPct?.[0] ?? '',
      row.ci95AvgDeltaPct?.[1] ?? '',
    ].join(','));
  }
  fs.writeFileSync(PERFORMANCE_FILES.statisticsCsv, csvRows.join('\n'));
}

function main() {
  const rows = buildSummaryRows();
  writeMarkdown(rows);
  writeCsv(rows);
}

main();

import fs from 'fs';
import path from 'path';
import { PERFORMANCE_FILES } from './report-paths';
const { jStat } = require('jstat');

const MODELS = ['jwt', 'oauth', 'sessions'];
const BOOTSTRAP_ITERATIONS = 10000;
const PRACTICAL_EFFECT_THRESHOLDS_PCT = [1, 2, 3, 5];

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

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function derivePairedBootstrapSeed(model: string, values: number[]) {
  // Stable model-and-data-derived seeds make sensitivity intervals reproducible without sharing RNG state across models.
  const modelSeed = [...model].reduce((sum, character, index) => sum + character.charCodeAt(0) * (index + 1) * 1009, 20261006);
  const dataSeed = values.reduce((sum, value, index) => sum + Math.round(value * 1000) * (index + 17), 0);
  return (modelSeed + dataSeed) >>> 0;
}

export function pairedBootstrapMean95(values: number[], seed: number, iterations = BOOTSTRAP_ITERATIONS) {
  if (values.length < 2 || iterations < 1) return null;
  const random = seededRandom(seed);
  // Each value is already a within-run paired delta, so resample whole matched blocks rather than requests.
  const bootstrapMeans = Array.from({ length: iterations }, () => {
    let total = 0;
    for (let draw = 0; draw < values.length; draw += 1) {
      total += values[Math.floor(random() * values.length)];
    }
    return total / values.length;
  });
  return [quantile(bootstrapMeans, 0.025), quantile(bootstrapMeans, 0.975)];
}

export function exceedsPracticalThreshold(effectPct: number, thresholdPct: number) {
  return Math.abs(effectPct) >= thresholdPct;
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
  if (avgDeltaPct > 0) {
    return 'Mean latency increased for the tested invalid-credential workload; this measures rejection-path cost, not successful authenticated throughput.';
  }
  if (avgDeltaPct < 0) {
    return 'Mean latency decreased for the tested invalid-credential workload, consistent with faster rejection; this is not evidence of improved normal-workload capacity.';
  }
  return 'Mean latency was unchanged for the tested invalid-credential workload; this does not establish equivalent performance under successful authenticated traffic.';
}

export type RunSample = {
  runId: string;
  values: number[];
  verifiedMatchedBlock: boolean;
  summary?: Record<string, number>;
};

export type MatchedBlockMetadata = {
    protocolVersion?: number;
    matchedBlockVerified?: boolean;
    status?: string;
    conditionOrder?: string[];
    conditions?: Record<string, { order?: number; status?: string; startedAt?: string | null; completedAt?: string | null }>;
  };

export function isVerifiedMatchedMetadata(metadata: MatchedBlockMetadata | null) {
  // Only protocol-v7 blocks with complete, non-overlapping condition timing enter current inference.
  const baseline = metadata?.conditions?.baseline;
  const attacks = metadata?.conditions?.attacks;
  const validOrder = metadata?.conditionOrder?.length === 2 &&
    new Set(metadata.conditionOrder).size === 2 &&
    metadata.conditionOrder.includes('baseline') &&
    metadata.conditionOrder.includes('attacks');
  const baselineOrder = metadata?.conditionOrder?.indexOf('baseline') ?? -2;
  const attacksOrder = metadata?.conditionOrder?.indexOf('attacks') ?? -2;
  const firstCondition = metadata?.conditionOrder?.[0] === 'baseline' ? baseline : attacks;
  const secondCondition = metadata?.conditionOrder?.[1] === 'attacks' ? attacks : baseline;
  const firstCompletedAt = firstCondition?.completedAt ? Date.parse(firstCondition.completedAt) : Number.NaN;
  const secondStartedAt = secondCondition?.startedAt ? Date.parse(secondCondition.startedAt) : Number.NaN;
  return metadata?.protocolVersion === 7 &&
    metadata.matchedBlockVerified === true &&
    metadata.status === 'completed' &&
    validOrder &&
    baseline?.status === 'completed' && Boolean(baseline.startedAt) && Boolean(baseline.completedAt) &&
    attacks?.status === 'completed' && Boolean(attacks.startedAt) && Boolean(attacks.completedAt) &&
    baseline.order === baselineOrder + 1 &&
    attacks.order === attacksOrder + 1 &&
    Number.isFinite(firstCompletedAt) && Number.isFinite(secondStartedAt) && firstCompletedAt <= secondStartedAt;
}

export function isVerifiedMatchedBlock(runId: string) {
  const metadata = safeReadJson<MatchedBlockMetadata>(path.join('docs', 'performance-results', 'runs', runId, 'metadata.json'));
  return isVerifiedMatchedMetadata(metadata);
}

function scanRunSamples(kind: 'baseline' | 'attacks', model: string): RunSample[] {
  const runsRoot = path.join('docs', 'performance-results', 'runs');
  if (!fs.existsSync(runsRoot)) return [];
  const runIds = fs.readdirSync(runsRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  const samples: RunSample[] = [];
  for (const runId of runIds) {
    const summaryPath = path.join(runsRoot, runId, kind, `${model}.json`);
    const summary = safeReadJson<Record<string, number>>(summaryPath);
    if (summary && Number.isFinite(summary.avg)) {
      samples.push({
        runId,
        values: [summary.avg],
        verifiedMatchedBlock: isVerifiedMatchedBlock(runId),
        summary,
      });
    }
  }
  return samples;
}

export function pairedDeltas(baseline: RunSample[], attacks: RunSample[]) {
  return pairedMetricDeltas(baseline, attacks, 'avg');
}

export function pairedMetricDeltas(baseline: RunSample[], attacks: RunSample[], metric: string) {
  // Match by run ID so condition-order rotation cannot break the baseline/attack pairing.
  const baselineByRun = new Map(baseline.map((sample) => [sample.runId, sample]));
  return attacks.flatMap((attackSample) => {
    const baselineSample = baselineByRun.get(attackSample.runId);
    if (!baselineSample || !baselineSample.verifiedMatchedBlock || !attackSample.verifiedMatchedBlock) return [];
    const baselineValue = baselineSample.summary?.[metric] ?? baselineSample.values[0];
    const attackValue = attackSample.summary?.[metric] ?? attackSample.values[0];
    if (baselineValue === 0 || !Number.isFinite(baselineValue) || !Number.isFinite(attackValue)) return [];
    return [percentDelta(baselineValue, attackValue)];
  });
}

export function holmBonferroni(pValues: number[]) {
  const ordered = pValues.map((pValue, index) => ({ pValue, index })).sort((a, b) => a.pValue - b.pValue);
  const adjusted = new Array<number>(pValues.length);
  let runningMaximum = 0;
  // Enforce nondecreasing adjusted p-values in ranked order, as required by the step-down procedure.
  ordered.forEach(({ pValue, index }, rank) => {
    runningMaximum = Math.max(runningMaximum, Math.min(1, pValue * (ordered.length - rank)));
    adjusted[index] = runningMaximum;
  });
  return adjusted;
}

export function pairedTTest(differences: number[]) {
  if (differences.length < 2) return null;
  const differenceSd = stdDev(differences);
  // With no observed variation, the t statistic is undefined rather than evidence of a zero effect.
  if (differenceSd === 0) return null;
  const tStat = mean(differences) / (differenceSd / Math.sqrt(differences.length));
  const df = differences.length - 1;
  const pValue = Math.min(1, 2 * jStat.studentt.cdf(-Math.abs(tStat), df));
  return { tStat, df, pValue };
}

export function ci95OfPairedMean(differences: number[]) {
  if (differences.length < 2) return null;
  const differenceSd = stdDev(differences);
  // A zero standard error leaves the usual t-based interval undefined for this reporting path.
  if (differenceSd === 0) return null;
  const df = differences.length - 1;
  const tCritical = jStat.studentt.inv(0.975, df);
  const margin = tCritical * differenceSd / Math.sqrt(differences.length);
  const differenceMean = mean(differences);
  return [differenceMean - margin, differenceMean + margin];
}

function toFixed(value: number | null, digits = 2) {
  return Number.isFinite(value ?? Number.NaN) ? (value as number).toFixed(digits) : 'n/a';
}

function formatPValue(value: number | null) {
  if (!Number.isFinite(value ?? Number.NaN)) return 'n/a';
  return (value as number) < 0.0001 ? '<0.0001' : (value as number).toFixed(4);
}

function buildSummaryRows() {
  const rows = MODELS.map((model) => {
    const allBaselineSamples = scanRunSamples('baseline', model);
    const allAttackSamples = scanRunSamples('attacks', model);
    const attackByRun = new Map(allAttackSamples.map((sample) => [sample.runId, sample]));
    // Exclude legacy, partial, and failed runs before calculating either summaries or paired effects.
    const baselineSamples = allBaselineSamples.filter((sample) => {
      const attackSample = attackByRun.get(sample.runId);
      return sample.verifiedMatchedBlock && Boolean(attackSample?.verifiedMatchedBlock);
    });
    const matchedRunIds = new Set(baselineSamples.map((sample) => sample.runId));
    const attackSamples = allAttackSamples.filter((sample) => matchedRunIds.has(sample.runId));
    if (baselineSamples.length === 0) {
      throw new Error(`No completed protocol-v2 matched runs found for '${model}'.`);
    }
    const aggregateMetric = (samples: RunSample[], metric: string) => mean(
      samples.map((sample) => sample.summary?.[metric] ?? Number.NaN).filter(Number.isFinite)
    );
    const baseline = Object.fromEntries(['avg', 'p95', 'p99', 'throughput'].map((metric) => [metric, aggregateMetric(baselineSamples, metric)]));
    const attacks = Object.fromEntries(['avg', 'p95', 'p99', 'throughput'].map((metric) => [metric, aggregateMetric(attackSamples, metric)]));
    const runDeltasPct = pairedDeltas(baselineSamples, attackSamples);
    const pairedTest = pairedTTest(runDeltasPct);
    const pairedStdDev = stdDev(runDeltasPct);
    const pairedEffectSize = pairedStdDev > 0 ? mean(runDeltasPct) / pairedStdDev : null;
    const ci95PairedDeltaPct = ci95OfPairedMean(runDeltasPct);
    const bootstrapSeed = derivePairedBootstrapSeed(model, runDeltasPct);
    const ci95PairedBootstrapPct = pairedBootstrapMean95(runDeltasPct, bootstrapSeed);
    return {
      model,
      baseline,
      attacks,
      baselineRunCount: baselineSamples.length,
      attackRunCount: attackSamples.length,
      verifiedPairedRunCount: runDeltasPct.length,
      meanPairedDeltaPct: runDeltasPct.length > 0 ? mean(runDeltasPct) : null,
      avgDeltaPct: percentDelta(baseline.avg ?? 0, attacks.avg ?? 0),
      p95DeltaPct: mean(pairedMetricDeltas(baselineSamples, attackSamples, 'p95')),
      p99DeltaPct: mean(pairedMetricDeltas(baselineSamples, attackSamples, 'p99')),
      throughputDeltaPct: mean(pairedMetricDeltas(baselineSamples, attackSamples, 'throughput')),
      interpretation: buildPerformanceInterpretation(baseline, attacks),
      pairedEffectSize,
      pairedTStat: pairedTest?.tStat ?? null,
      pairedDf: pairedTest?.df ?? null,
      pairedPValue: pairedTest?.pValue ?? null,
      ci95PairedDeltaPct,
      bootstrapSeed,
      ci95PairedBootstrapPct,
      practicalThresholdSensitivity: Object.fromEntries(
        PRACTICAL_EFFECT_THRESHOLDS_PCT.map((threshold) => [threshold, exceedsPracticalThreshold(mean(runDeltasPct), threshold)])
      ),
      baselineAvgOutliers: scanIqrOutliers(baselineSamples, (values) => mean(values)),
      attackAvgOutliers: scanIqrOutliers(attackSamples, (values) => mean(values)),
    };
  });
  const testableIndices = rows.flatMap((row, index) => row.pairedPValue === null ? [] : [index]);
  const adjustedPValues = holmBonferroni(testableIndices.map((index) => rows[index].pairedPValue as number));
  return rows.map((row, index) => ({
    ...row,
    pairedAdjustedPValue: testableIndices.includes(index) ? adjustedPValues[testableIndices.indexOf(index)] : null,
  }));
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
  lines.push('- Throughput is derived as 1,000 divided by mean sequential request latency; it is not an independent concurrent-load measurement.');
  lines.push('- Run-level observations are the retained per-run summary means; request observations are not treated as independent replicates.');
  lines.push('- Paired inference uses within-block percentage differences only for completed protocol-version 7 blocks with both conditions timestamped and sequentially ordered.');
  lines.push('- Protocol v7 times 1,000 protected-resource requests per mechanism and condition over one reused localhost server and keep-alive connection; baseline credentials must return HTTP 200 and invalid attack credentials must return HTTP 401. OAuth token issuance is setup, not the timed workload.');
  lines.push('- The Sessions attack sends an invalid value in the application’s `sessionId` cookie, exercising session lookup/rejection rather than the missing-cookie branch.');
  lines.push('- The primary table includes only complete protocol-v7 matched blocks; legacy, partial, failed, and earlier-protocol runs are excluded.');
  lines.push('- Primary estimates are aggregated from per-run files; top-level baseline/attack JSON files are latest-run convenience outputs and are not inferential inputs.');
  lines.push('- Paired effect size is Cohen\'s dz; paired confidence intervals use the two-sided 95% Student t interval for the mean within-block percentage difference.');
  lines.push(`- Bootstrap sensitivity interval: ${BOOTSTRAP_ITERATIONS.toLocaleString('en-US')} deterministic resamples of whole matched-block mean-latency differences; bootstrap seed is reported by mechanism.`);
  lines.push('- Outlier screening uses a Tukey 1.5 x IQR rule over retained run-level summary means when at least 4 runs exist.');
  lines.push('');
  lines.push('## Comparative Summary');
  lines.push('');
  lines.push('| Model | Mean Baseline Avg (ms) | Mean Attack Avg (ms) | Aggregate Avg Delta % | Mean Paired p95 Delta % | Mean Paired p99 Delta % | Mean Paired Throughput Delta % | Baseline runs | Attack runs | Verified pairs | Mean paired avg delta % | Paired Cohen dz | Paired t p | Holm-adjusted p | 95% Paired t CI | 95% Paired bootstrap CI | Bootstrap seed |');
  lines.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---:|');
  for (const row of rows) {
    const ci = row.ci95PairedDeltaPct ? `[${toFixed(row.ci95PairedDeltaPct[0])}, ${toFixed(row.ci95PairedDeltaPct[1])}]` : 'n/a';
    const bootstrapCi = row.ci95PairedBootstrapPct ? `[${toFixed(row.ci95PairedBootstrapPct[0])}, ${toFixed(row.ci95PairedBootstrapPct[1])}]` : 'n/a';
    lines.push(`| ${row.model.toUpperCase()} | ${toFixed(row.baseline.avg ?? 0, 4)} | ${toFixed(row.attacks.avg ?? 0, 4)} | ${toFixed(row.avgDeltaPct)} | ${toFixed(row.p95DeltaPct)} | ${toFixed(row.p99DeltaPct)} | ${toFixed(row.throughputDeltaPct)} | ${row.baselineRunCount} | ${row.attackRunCount} | ${row.verifiedPairedRunCount} | ${toFixed(row.meanPairedDeltaPct)} | ${toFixed(row.pairedEffectSize)} | ${formatPValue(row.pairedPValue)} | ${formatPValue(row.pairedAdjustedPValue)} | ${ci} | ${bootstrapCi} | ${row.bootstrapSeed} |`);
  }
  lines.push('');
  lines.push('Verified completed protocol-v7 pairs are the inferential sample size. Paired t-test p-values are Holm-adjusted across the three mechanism-level average-latency contrasts.');
  lines.push('');
  lines.push('## Practical Effect Sensitivity (Exploratory)');
  lines.push('');
  lines.push('No practical latency threshold was prespecified before this collection. The grid below is a post-hoc sensitivity view showing whether the absolute observed paired mean effect reaches each threshold; it is not a confirmatory decision rule.');
  lines.push('');
  lines.push(`| Model | ${PRACTICAL_EFFECT_THRESHOLDS_PCT.map((threshold) => `>=${threshold}%`).join(' | ')} |`);
  lines.push(`|---|${PRACTICAL_EFFECT_THRESHOLDS_PCT.map(() => '---:').join('|')}|`);
  for (const row of rows) {
    const sensitivity = PRACTICAL_EFFECT_THRESHOLDS_PCT.map((threshold) => row.practicalThresholdSensitivity[threshold] ? 'Yes' : 'No');
    lines.push(`| ${row.model.toUpperCase()} | ${sensitivity.join(' | ')} |`);
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
  lines.push('- Primary analysis inputs: docs/performance-results/runs/<runId>/<baseline|attacks>/<model>.json');
  lines.push('- Top-level baseline/attack JSON and raw traces are retained for convenience and audit, not used for the paired estimates.');
  lines.push('- Baseline raw traces: docs/performance-results/baseline/raw/*.json');
  lines.push('- Attack raw traces: docs/performance-results/attacks/raw/*.json');
  lines.push('- Per-run summaries: docs/performance-results/runs/<runId>/<baseline|attacks>/<model>.json');
  lines.push('- Matched-block protocol metadata: docs/performance-results/runs/<runId>/metadata.json');
  fs.writeFileSync(PERFORMANCE_FILES.analysis, `${lines.join('\n')}\n`);
}

function writeCsv(rows: ReturnType<typeof buildSummaryRows>) {
  const header = ['model', 'baseline_avg_ms', 'attack_avg_ms', 'aggregate_avg_delta_pct', 'p95_delta_pct', 'p99_delta_pct', 'throughput_delta_pct', 'baseline_run_count', 'attack_run_count', 'verified_paired_run_count', 'mean_paired_delta_pct', 'paired_cohens_dz', 'paired_t_stat', 'paired_df', 'paired_p_value', 'paired_holm_adjusted_p_value', 'ci95_paired_delta_pct_lower', 'ci95_paired_delta_pct_upper', 'ci95_paired_bootstrap_pct_lower', 'ci95_paired_bootstrap_pct_upper', 'paired_bootstrap_seed', 'effect_ge_1_pct', 'effect_ge_2_pct', 'effect_ge_3_pct', 'effect_ge_5_pct'];
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
      row.baselineRunCount,
      row.attackRunCount,
      row.verifiedPairedRunCount,
      row.meanPairedDeltaPct ?? '',
      row.pairedEffectSize ?? '',
      row.pairedTStat ?? '',
      row.pairedDf ?? '',
      row.pairedPValue ?? '',
      row.pairedAdjustedPValue ?? '',
      row.ci95PairedDeltaPct?.[0] ?? '',
      row.ci95PairedDeltaPct?.[1] ?? '',
      row.ci95PairedBootstrapPct?.[0] ?? '',
      row.ci95PairedBootstrapPct?.[1] ?? '',
      row.bootstrapSeed,
      row.practicalThresholdSensitivity[1],
      row.practicalThresholdSensitivity[2],
      row.practicalThresholdSensitivity[3],
      row.practicalThresholdSensitivity[5],
    ].join(','));
  }
  fs.writeFileSync(PERFORMANCE_FILES.statisticsCsv, csvRows.join('\n'));
}

function main() {
  const rows = buildSummaryRows();
  writeMarkdown(rows);
  writeCsv(rows);
}

if (require.main === module) main();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const report_paths_1 = require("./report-paths");
const { jStat } = require('jstat');
const MODELS = ['jwt', 'oauth', 'sessions'];
function mean(values) {
    return values.reduce((a, b) => a + b, 0) / values.length;
}
function stdDev(values) {
    if (values.length < 2)
        return 0;
    const m = mean(values);
    const variance = values.reduce((acc, value) => acc + (value - m) ** 2, 0) / (values.length - 1);
    return Math.sqrt(variance);
}
function quantile(values, p) {
    if (values.length === 0)
        return Number.NaN;
    if (values.length === 1)
        return values[0];
    const sorted = [...values].sort((a, b) => a - b);
    const index = (sorted.length - 1) * p;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper)
        return sorted[lower];
    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}
function scanIqrOutliers(samples, selector) {
    if (samples.length < 4)
        return null;
    const values = samples.map(selector).filter((value) => Number.isFinite(value));
    if (values.length < 4)
        return null;
    const q1 = quantile(values, 0.25);
    const q3 = quantile(values, 0.75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    const outliers = samples
        .map((sample) => ({ runId: sample.runId, value: selector(sample) }))
        .filter((sample) => Number.isFinite(sample.value) && (sample.value < lowerBound || sample.value > upperBound));
    return {
        lowerBound,
        upperBound,
        outliers,
    };
}
function pooledStd(a, b) {
    if (a.length < 2 || b.length < 2)
        return 0;
    const varA = stdDev(a) ** 2;
    const varB = stdDev(b) ** 2;
    const pooledVariance = ((a.length - 1) * varA + (b.length - 1) * varB) / (a.length + b.length - 2);
    return Math.sqrt(pooledVariance);
}
function welchTest(a, b) {
    if (a.length < 2 || b.length < 2)
        return null;
    const meanA = mean(a);
    const meanB = mean(b);
    const varA = stdDev(a) ** 2;
    const varB = stdDev(b) ** 2;
    const nA = a.length;
    const nB = b.length;
    const denominator = Math.sqrt(varA / nA + varB / nB);
    if (!Number.isFinite(denominator) || denominator === 0)
        return null;
    const tStat = (meanB - meanA) / denominator;
    const numerator = (varA / nA + varB / nB) ** 2;
    const denominatorDf = varA ** 2 / (nA ** 2 * (nA - 1)) + varB ** 2 / (nB ** 2 * (nB - 1));
    if (!Number.isFinite(denominatorDf) || denominatorDf === 0)
        return null;
    const df = numerator / denominatorDf;
    const cdf = jStat.studentt.cdf(Math.abs(tStat), df);
    const pValue = 2 * (1 - cdf);
    return {
        tStat,
        df,
        pValue,
    };
}
function safeReadJson(path) {
    if (!fs_1.default.existsSync(path))
        return null;
    return JSON.parse(fs_1.default.readFileSync(path, 'utf8'));
}
function percentDelta(baseline, other) {
    if (baseline === 0)
        return 0;
    return ((other - baseline) / baseline) * 100;
}
function scanRunSamples(kind, model) {
    const runsRoot = 'docs/performance-results/runs';
    if (!fs_1.default.existsSync(runsRoot))
        return [];
    const runIds = fs_1.default
        .readdirSync(runsRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
    const samples = [];
    for (const runId of runIds) {
        const samplePath = `${runsRoot}/${runId}/${kind}/${model}.json`;
        const sample = safeReadJson(samplePath);
        if (sample) {
            samples.push({ runId, stats: sample });
        }
    }
    return samples;
}
function ci95OfMeanDifference(a, b) {
    if (a.length < 2 || b.length < 2)
        return null;
    const meanA = mean(a);
    const meanB = mean(b);
    const sdA = stdDev(a);
    const sdB = stdDev(b);
    const se = Math.sqrt(sdA ** 2 / a.length + sdB ** 2 / b.length);
    if (se === 0)
        return [0, 0];
    const welch = welchTest(a, b);
    if (!welch)
        return null;
    const tCritical = jStat.studentt.inv(0.975, welch.df);
    const lower = percentDelta(meanA, meanB - tCritical * se);
    const upper = percentDelta(meanA, meanB + tCritical * se);
    return lower < upper ? [lower, upper] : [upper, lower];
}
function toFixed(value, digits = 2) {
    return Number.isFinite(value) ? value.toFixed(digits) : 'n/a';
}
function buildSummaryRows() {
    return MODELS.map((model) => {
        const baseline = safeReadJson(`docs/performance-results/baseline/${model}.json`);
        const attacks = safeReadJson(`docs/performance-results/attacks/${model}.json`);
        if (!baseline || !attacks) {
            throw new Error(`Missing baseline/attack data for model '${model}'. Run: npm run perf`);
        }
        const baselineSamples = scanRunSamples('baseline', model);
        const attackSamples = scanRunSamples('attacks', model);
        const baselineAverages = baselineSamples.map((sample) => sample.stats.avg);
        const attackAverages = attackSamples.map((sample) => sample.stats.avg);
        const pooled = pooledStd(baselineAverages, attackAverages);
        const effectSize = pooled > 0 ? (mean(attackAverages) - mean(baselineAverages)) / pooled : null;
        const welch = welchTest(baselineAverages, attackAverages);
        const ci95AvgDeltaPct = ci95OfMeanDifference(baselineAverages, attackAverages);
        return {
            model,
            baseline,
            attacks,
            avgDeltaPct: percentDelta(baseline.avg, attacks.avg),
            p95DeltaPct: percentDelta(baseline.p95, attacks.p95),
            p99DeltaPct: percentDelta(baseline.p99, attacks.p99),
            throughputDeltaPct: percentDelta(baseline.throughput, attacks.throughput),
            effectSize,
            welchTStat: welch?.tStat ?? null,
            welchDf: welch?.df ?? null,
            welchPValue: welch?.pValue ?? null,
            ci95AvgDeltaPct,
            baselineAvgOutliers: scanIqrOutliers(baselineSamples, (sample) => sample.stats.avg),
            attackAvgOutliers: scanIqrOutliers(attackSamples, (sample) => sample.stats.avg),
        };
    });
}
function writeMarkdown(rows) {
    const timestamp = new Date().toISOString();
    const lines = [];
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
    lines.push('');
    lines.push('## Comparative Summary');
    lines.push('');
    lines.push('| Model | Baseline Avg (ms) | Attack Avg (ms) | Avg Delta % | p95 Delta % | p99 Delta % | Throughput Delta % | Effect Size (d) | Welch p-value | 95% CI Avg Delta % |');
    lines.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
    for (const row of rows) {
        const ci = row.ci95AvgDeltaPct
            ? `[${toFixed(row.ci95AvgDeltaPct[0])}, ${toFixed(row.ci95AvgDeltaPct[1])}]`
            : 'n/a';
        lines.push(`| ${row.model.toUpperCase()} | ${toFixed(row.baseline.avg, 4)} | ${toFixed(row.attacks.avg, 4)} | ${toFixed(row.avgDeltaPct)} | ${toFixed(row.p95DeltaPct)} | ${toFixed(row.p99DeltaPct)} | ${toFixed(row.throughputDeltaPct)} | ${row.effectSize === null ? 'n/a' : toFixed(row.effectSize)} | ${row.welchPValue === null ? 'n/a' : toFixed(row.welchPValue, 4)} | ${ci} |`);
    }
    lines.push('');
    lines.push('## Exploratory Outlier Screening (Repeated-Run Avg Latency)');
    lines.push('');
    lines.push('| Model | Baseline Avg Outliers | Attack Avg Outliers | Baseline IQR Bounds | Attack IQR Bounds | Interpretation |');
    lines.push('|---|---|---|---|---|---|');
    for (const row of rows) {
        const baselineOutliers = row.baselineAvgOutliers?.outliers ?? [];
        const attackOutliers = row.attackAvgOutliers?.outliers ?? [];
        const baselineOutlierText = baselineOutliers.length
            ? baselineOutliers.map((sample) => `${sample.runId}=${toFixed(sample.value, 4)}`).join(', ')
            : row.baselineAvgOutliers
                ? 'None'
                : 'n/a';
        const attackOutlierText = attackOutliers.length
            ? attackOutliers.map((sample) => `${sample.runId}=${toFixed(sample.value, 4)}`).join(', ')
            : row.attackAvgOutliers
                ? 'None'
                : 'n/a';
        const baselineBounds = row.baselineAvgOutliers
            ? `[${toFixed(row.baselineAvgOutliers.lowerBound, 4)}, ${toFixed(row.baselineAvgOutliers.upperBound, 4)}]`
            : 'n/a';
        const attackBounds = row.attackAvgOutliers
            ? `[${toFixed(row.attackAvgOutliers.lowerBound, 4)}, ${toFixed(row.attackAvgOutliers.upperBound, 4)}]`
            : 'n/a';
        const interpretation = baselineOutliers.length || attackOutliers.length
            ? 'Inspect flagged runs before making strong performance claims.'
            : row.baselineAvgOutliers && row.attackAvgOutliers
                ? 'No repeated-run avg-latency outliers flagged under the IQR rule.'
                : 'Insufficient repeated-run cohorts for IQR screening.';
        lines.push(`| ${row.model.toUpperCase()} | ${baselineOutlierText} | ${attackOutlierText} | ${baselineBounds} | ${attackBounds} | ${interpretation} |`);
    }
    lines.push('');
    lines.push('## Raw Inputs');
    lines.push('');
    lines.push('- Baseline files: docs/performance-results/baseline/*.json');
    lines.push('- Attack files: docs/performance-results/attacks/*.json');
    lines.push('- Optional repeated samples: docs/performance-results/runs/<runId>/<baseline|attacks>/<model>.json');
    const outputPath = report_paths_1.PERFORMANCE_FILES.analysis;
    fs_1.default.writeFileSync(outputPath, `${lines.join('\n')}\n`);
    console.log(`Wrote ${outputPath}`);
}
function writeCsv(rows) {
    const header = [
        'model',
        'baseline_avg_ms',
        'attack_avg_ms',
        'avg_delta_pct',
        'p95_delta_pct',
        'p99_delta_pct',
        'throughput_delta_pct',
        'cohens_d',
        'welch_t_stat',
        'welch_df',
        'welch_p_value',
        'ci95_avg_delta_pct_lower',
        'ci95_avg_delta_pct_upper',
        'baseline_avg_outlier_count',
        'attack_avg_outlier_count',
    ];
    const csvRows = [header.join(',')];
    for (const row of rows) {
        csvRows.push([
            row.model,
            row.baseline.avg,
            row.attacks.avg,
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
            row.baselineAvgOutliers?.outliers.length ?? '',
            row.attackAvgOutliers?.outliers.length ?? '',
        ].join(','));
    }
    const outputPath = report_paths_1.PERFORMANCE_FILES.statisticsCsv;
    fs_1.default.writeFileSync(outputPath, csvRows.join('\n'));
    console.log(`Wrote ${outputPath}`);
}
function main() {
    const rows = buildSummaryRows();
    writeMarkdown(rows);
    writeCsv(rows);
}
main();

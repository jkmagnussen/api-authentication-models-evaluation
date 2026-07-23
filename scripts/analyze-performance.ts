import fs from "fs";
import { PERFORMANCE_FILES } from "./report-paths";

const { jStat } = require("jstat") as {
  jStat: {
    studentt: {
      cdf: (x: number, dof: number) => number;
      inv: (p: number, dof: number) => number;
    };
  };
};

type PerfStats = {
  avg: number;
  p95: number;
  p99: number;
  throughput: number;
  errorRate?: number;
};

type Metric = "avg" | "p95" | "p99" | "throughput";

type SummaryRow = {
  model: string;
  baseline: PerfStats;
  attacks: PerfStats;
  avgDeltaPct: number;
  p95DeltaPct: number;
  p99DeltaPct: number;
  throughputDeltaPct: number;
  effectSize: number | null;
  welchTStat: number | null;
  welchDf: number | null;
  welchPValue: number | null;
  ci95AvgDeltaPct: [number, number] | null;
};

const MODELS = ["jwt", "oauth", "sessions"];
const METRICS: Metric[] = ["avg", "p95", "p99", "throughput"];

function mean(values: number[]) {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[]) {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((acc, value) => acc + (value - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function pooledStd(a: number[], b: number[]) {
  if (a.length < 2 || b.length < 2) return 0;
  const varA = stdDev(a) ** 2;
  const varB = stdDev(b) ** 2;
  const pooledVariance = ((a.length - 1) * varA + (b.length - 1) * varB) / (a.length + b.length - 2);
  return Math.sqrt(pooledVariance);
}

function welchTest(a: number[], b: number[]): { tStat: number; df: number; pValue: number } | null {
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
  const denominatorDf = (varA ** 2) / (nA ** 2 * (nA - 1)) + (varB ** 2) / (nB ** 2 * (nB - 1));
  if (!Number.isFinite(denominatorDf) || denominatorDf === 0) return null;

  const df = numerator / denominatorDf;
  const cdf = jStat.studentt.cdf(Math.abs(tStat), df);
  const pValue = 2 * (1 - cdf);

  return {
    tStat,
    df,
    pValue,
  };
}

function safeReadJson<T>(path: string): T | null {
  if (!fs.existsSync(path)) return null;
  return JSON.parse(fs.readFileSync(path, "utf8")) as T;
}

function percentDelta(baseline: number, other: number) {
  if (baseline === 0) return 0;
  return ((other - baseline) / baseline) * 100;
}

function scanRunSamples(kind: "baseline" | "attacks", model: string): PerfStats[] {
  const runsRoot = "docs/performance-results/runs";
  if (!fs.existsSync(runsRoot)) return [];

  const runIds = fs
    .readdirSync(runsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  const samples: PerfStats[] = [];
  for (const runId of runIds) {
    const samplePath = `${runsRoot}/${runId}/${kind}/${model}.json`;
    const sample = safeReadJson<PerfStats>(samplePath);
    if (sample) samples.push(sample);
  }

  return samples;
}

function ci95OfMeanDifference(a: number[], b: number[]): [number, number] | null {
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

function toFixed(value: number, digits = 2) {
  return Number.isFinite(value) ? value.toFixed(digits) : "n/a";
}

function buildSummaryRows(): SummaryRow[] {
  return MODELS.map((model) => {
    const baseline = safeReadJson<PerfStats>(`docs/performance-results/baseline/${model}.json`);
    const attacks = safeReadJson<PerfStats>(`docs/performance-results/attacks/${model}.json`);

    if (!baseline || !attacks) {
      throw new Error(`Missing baseline/attack data for model '${model}'. Run: npm run perf`);
    }

    const baselineSamples = scanRunSamples("baseline", model);
    const attackSamples = scanRunSamples("attacks", model);

    const baselineAverages = baselineSamples.map((sample) => sample.avg);
    const attackAverages = attackSamples.map((sample) => sample.avg);

    const pooled = pooledStd(baselineAverages, attackAverages);
    const effectSize =
      pooled > 0 ? (mean(attackAverages) - mean(baselineAverages)) / pooled : null;

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
    };
  });
}

function writeMarkdown(rows: SummaryRow[]) {
  const timestamp = new Date().toISOString();

  const lines: string[] = [];
  lines.push("# Performance Analysis");
  lines.push("");
  lines.push(`Generated: ${timestamp}`);
  lines.push("Regenerate: npm run perf:analyze");
  lines.push("");
  lines.push("## Method");
  lines.push("");
  lines.push("- Delta percentages compare attacks vs baseline: ((attack - baseline) / baseline) * 100.");
  lines.push("- Positive latency deltas indicate slower response under attack.");
  lines.push("- Negative throughput delta indicates throughput degradation under attack.");
  lines.push("- Effect size is Cohen's d over repeated-run avg latency samples (if run samples exist).");
  lines.push("- CI shown is 95% interval for avg latency delta percentage (if repeated-run samples exist).");
  lines.push("");

  lines.push("## Comparative Summary");
  lines.push("");
  lines.push("| Model | Baseline Avg (ms) | Attack Avg (ms) | Avg Delta % | p95 Delta % | p99 Delta % | Throughput Delta % | Effect Size (d) | Welch p-value | 95% CI Avg Delta % |");
  lines.push("|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|");

  for (const row of rows) {
    const ci = row.ci95AvgDeltaPct
      ? `[${toFixed(row.ci95AvgDeltaPct[0])}, ${toFixed(row.ci95AvgDeltaPct[1])}]`
      : "n/a";

    lines.push(
      `| ${row.model.toUpperCase()} | ${toFixed(row.baseline.avg, 4)} | ${toFixed(row.attacks.avg, 4)} | ${toFixed(row.avgDeltaPct)} | ${toFixed(row.p95DeltaPct)} | ${toFixed(row.p99DeltaPct)} | ${toFixed(row.throughputDeltaPct)} | ${row.effectSize === null ? "n/a" : toFixed(row.effectSize)} | ${row.welchPValue === null ? "n/a" : toFixed(row.welchPValue, 4)} | ${ci} |`
    );
  }

  lines.push("");
  lines.push("## Raw Inputs");
  lines.push("");
  lines.push("- Baseline files: docs/performance-results/baseline/*.json");
  lines.push("- Attack files: docs/performance-results/attacks/*.json");
  lines.push("- Optional repeated samples: docs/performance-results/runs/<runId>/<baseline|attacks>/<model>.json");

  const outputPath = PERFORMANCE_FILES.analysis;
  fs.writeFileSync(outputPath, `${lines.join("\n")}\n`);
  console.log(`Wrote ${outputPath}`);
}

function writeCsv(rows: SummaryRow[]) {
  const header = [
    "model",
    "baseline_avg_ms",
    "attack_avg_ms",
    "avg_delta_pct",
    "p95_delta_pct",
    "p99_delta_pct",
    "throughput_delta_pct",
    "cohens_d",
    "welch_t_stat",
    "welch_df",
    "welch_p_value",
    "ci95_avg_delta_pct_lower",
    "ci95_avg_delta_pct_upper",
  ];

  const csvRows = [header.join(",")];

  for (const row of rows) {
    csvRows.push([
      row.model,
      row.baseline.avg,
      row.attacks.avg,
      row.avgDeltaPct,
      row.p95DeltaPct,
      row.p99DeltaPct,
      row.throughputDeltaPct,
      row.effectSize ?? "",
      row.welchTStat ?? "",
      row.welchDf ?? "",
      row.welchPValue ?? "",
      row.ci95AvgDeltaPct?.[0] ?? "",
      row.ci95AvgDeltaPct?.[1] ?? "",
    ].join(","));
  }

  const outputPath = PERFORMANCE_FILES.statisticsCsv;
  fs.writeFileSync(outputPath, csvRows.join("\n"));
  console.log(`Wrote ${outputPath}`);
}

function main() {
  const rows = buildSummaryRows();
  writeMarkdown(rows);
  writeCsv(rows);
}

main();

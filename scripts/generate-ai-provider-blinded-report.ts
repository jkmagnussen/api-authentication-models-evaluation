import fs from "fs";
import path from "path";
import { GENERATED_FILES } from "./report-paths";

type FailureRateRow = {
  label: string;
  totalSamples: number;
  passedSamples: number;
  failedSamples: number;
  failureRatePct: number;
};

type ArmData = {
  key: string;
  rows: FailureRateRow[];
};

type OverallArm = {
  armId: string;
  failed: number;
  total: number;
  failureRatePct: number;
};

const ARM_KEYS = ["openai-neutral", "openai-security-guided", "claude-neutral", "claude-security-guided"] as const;
const ARMS_ROOT = path.join(process.cwd(), "ai-generated", "arms");

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
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

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function parseFailureRateCsv(csvText: string): FailureRateRow[] {
  const rows = csvText
    .trim()
    .split(/\r?\n/)
    .map(parseCsvLine);

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

function loadArmData(armKey: string): ArmData | null {
  const csvPath = path.join(ARMS_ROOT, armKey, "results", "ai-samples-failure-rates.csv");
  if (!fs.existsSync(csvPath)) return null;
  const csvText = fs.readFileSync(csvPath, "utf8");
  return { key: armKey, rows: parseFailureRateCsv(csvText) };
}

function fmt(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "n/a";
  return value.toFixed(digits);
}

function normalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (x > 0) p = 1 - p;
  return p;
}

function twoProportionPValue(failedA: number, totalA: number, failedB: number, totalB: number): number | null {
  if (totalA <= 0 || totalB <= 0) return null;
  const pPool = (failedA + failedB) / (totalA + totalB);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / totalA + 1 / totalB));
  if (!Number.isFinite(se) || se === 0) return null;
  const pA = failedA / totalA;
  const pB = failedB / totalB;
  const z = (pA - pB) / se;
  return 2 * (1 - normalCdf(Math.abs(z)));
}

function wilson95(failed: number, total: number): [number, number] | null {
  if (total <= 0) return null;
  const z = 1.959963984540054;
  const p = failed / total;
  const denom = 1 + (z * z) / total;
  const center = p + (z * z) / (2 * total);
  const margin = z * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total));
  return [(center - margin) / denom, (center + margin) / denom];
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

function seededLcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function bootstrapDelta95(a: OverallArm, b: OverallArm, iterations = 2000): [number, number] {
  const deltas: number[] = [];
  const seed =
    a.armId.charCodeAt(0) * 1009 +
    b.armId.charCodeAt(0) * 917 +
    a.failed * 131 +
    b.failed * 137 +
    a.total * 149 +
    b.total * 151;
  const rand = seededLcg(seed);
  const pA = a.failed / a.total;
  const pB = b.failed / b.total;

  for (let i = 0; i < iterations; i += 1) {
    let failA = 0;
    let failB = 0;
    for (let j = 0; j < a.total; j += 1) {
      if (rand() < pA) failA += 1;
    }
    for (let j = 0; j < b.total; j += 1) {
      if (rand() < pB) failB += 1;
    }
    deltas.push((failA / a.total) * 100 - (failB / b.total) * 100);
  }

  deltas.sort((x, y) => x - y);
  const low = deltas[Math.floor(iterations * 0.025)] ?? Number.NaN;
  const high = deltas[Math.floor(iterations * 0.975)] ?? Number.NaN;
  return [low, high];
}

function main(): void {
  const outputPath = path.join(process.cwd(), GENERATED_FILES.aiProviderPromptComparisonBlinded);
  const loaded = ARM_KEYS.map(loadArmData).filter((entry): entry is ArmData => entry !== null);

  const lines: string[] = [];
  lines.push("# AI Provider/Prompt Comparison (Blinded)");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("Regenerate: npm run compare:reports");
  lines.push("");
  lines.push("This blinded view hides provider and prompt-condition labels (Arm A-D) to reduce interpretation anchoring bias.");
  lines.push("");

  if (loaded.length === 0) {
    lines.push("No arm results found. Run npm run ai:matrix first.");
    fs.writeFileSync(outputPath, `${lines.join("\n")}\n`);
    console.log(`Wrote ${outputPath}`);
    return;
  }

  const blinded = loaded
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((entry, index) => ({
      armId: String.fromCharCode(65 + index),
      rows: entry.rows,
    }));

  lines.push("## Blinded Arm Metrics");
  lines.push("");
  lines.push("| Arm | OAUTH Failure % | JWT Failure % | SESSIONS Failure % | Overall Failure % | Overall 95% CI | Overall Samples |");
  lines.push("|---|---:|---:|---:|---:|---|---:|");

  const overallArms: OverallArm[] = [];

  for (const arm of blinded) {
    const oauth = rowByLabel(arm.rows, "OAUTH");
    const jwt = rowByLabel(arm.rows, "JWT");
    const sessions = rowByLabel(arm.rows, "SESSIONS");
    const overall = rowByLabel(arm.rows, "OVERALL");
    const overallCi = overall ? wilson95(overall.failedSamples, overall.totalSamples) : null;
    const ciText = overallCi ? `[${fmt(overallCi[0] * 100)}, ${fmt(overallCi[1] * 100)}]%` : "n/a";

    if (overall && overall.totalSamples > 0) {
      overallArms.push({
        armId: arm.armId,
        failed: overall.failedSamples,
        total: overall.totalSamples,
        failureRatePct: overall.failureRatePct,
      });
    }

    lines.push(
      `| Arm ${arm.armId} | ${fmt(oauth?.failureRatePct ?? Number.NaN)} | ${fmt(jwt?.failureRatePct ?? Number.NaN)} | ${fmt(sessions?.failureRatePct ?? Number.NaN)} | ${fmt(overall?.failureRatePct ?? Number.NaN)} | ${ciText} | ${overall?.totalSamples ?? "n/a"} |`
    );
  }

  const minPracticalEffectPct = Number(process.env.AI_MIN_PRACTICAL_EFFECT_PCT ?? "3");

  lines.push("");
  lines.push("## Blinded Pairwise Arm Contrasts");
  lines.push("");
  lines.push(`Decision rule: significance requires Holm-adjusted p <= 0.05 and practical effect requires |delta| >= ${fmt(minPracticalEffectPct)} percentage points.`);
  lines.push("");
  lines.push("| Arm A | Arm B | Delta Failure % (A-B) | 95% Bootstrap CI | Raw p | Holm-adjusted p | Practical Effect | Significant | Confirmatory-Eligible Contrast |");
  lines.push("|---|---|---:|---|---:|---:|---|---|---|");

  const pairs: Array<{ a: OverallArm; b: OverallArm; rawP: number | null }> = [];
  for (let i = 0; i < overallArms.length; i += 1) {
    for (let j = i + 1; j < overallArms.length; j += 1) {
      const a = overallArms[i];
      const b = overallArms[j];
      pairs.push({
        a,
        b,
        rawP: twoProportionPValue(a.failed, a.total, b.failed, b.total),
      });
    }
  }

  const adjusted = holmBonferroni(pairs.map((pair) => pair.rawP).filter((value): value is number => value !== null));
  let adjustedIndex = 0;
  for (const pair of pairs) {
    const delta = pair.a.failureRatePct - pair.b.failureRatePct;
    const deltaCi = bootstrapDelta95(pair.a, pair.b);
    const practical = Math.abs(delta) >= minPracticalEffectPct;

    if (pair.rawP === null) {
      lines.push(
        `| Arm ${pair.a.armId} | Arm ${pair.b.armId} | ${fmt(delta)} | [${fmt(deltaCi[0])}, ${fmt(deltaCi[1])}] | n/a | n/a | ${practical ? "Yes" : "No"} | n/a | No |`
      );
      continue;
    }

    const holm = adjusted[adjustedIndex];
    adjustedIndex += 1;
    const significant = holm <= 0.05;
    const eligible = significant && practical;
    lines.push(
      `| Arm ${pair.a.armId} | Arm ${pair.b.armId} | ${fmt(delta)} | [${fmt(deltaCi[0])}, ${fmt(deltaCi[1])}] | ${fmt(pair.rawP, 4)} | ${fmt(holm, 4)} | ${practical ? "Yes" : "No"} | ${significant ? "Yes" : "No"} | ${eligible ? "Yes" : "No"} |`
    );
  }

  lines.push("");
  lines.push("## Usage");
  lines.push("");
  lines.push("- Use this report for first-pass interpretation before viewing unblinded provider labels.");
  lines.push("- After blind interpretation, compare with docs/generated/AI_PROVIDER_PROMPT_COMPARISON.md for arm identities.");

  fs.writeFileSync(outputPath, `${lines.join("\n")}\n`);
  console.log(`Wrote ${outputPath}`);
}

main();

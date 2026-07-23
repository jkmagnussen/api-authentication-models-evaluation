import fs from "fs";
import path from "path";
import { GENERATED_FILES } from "./report-paths";

type AggregateMetric = {
  label: string;
  scope: string;
  fileCount: number;
  characters: number;
  lines: number;
  functions: number;
  classes: number;
  constants: number;
  cyclomaticComplexity: number;
  maintainabilityIndexAverage: number;
};

type VariantResult = {
  variantName: string;
  category: "oauth" | "jwt" | "sessions";
  passed: boolean;
};

type AiSampleRow = {
  model: "oauth" | "jwt" | "sessions";
  passed: boolean;
  securityFailures: string;
};

type DensityRow = {
  model: "oauth" | "jwt" | "sessions";
  modelLabel: string;
  source: "baseline" | "misconfiguration" | "ai";
  sliceLabel: string;
  characters: number;
  lines: number;
  functions: number;
  cyclomaticComplexity: number;
  failureEvents: number;
  failurePoints: number;
  failuresPer10kChars: number;
  failuresPer100Lines: number;
  failuresPer10Functions: number;
  failurePointsPer10kChars: number;
};

type VariantDensityRow = {
  variantName: string;
  model: "oauth" | "jwt" | "sessions";
  characters: number;
  lines: number;
  functions: number;
  cyclomaticComplexity: number;
  failureEvents: number;
  failuresPer10kChars: number;
  failuresPer100Lines: number;
};

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

function readCsv(filePath: string): string[][] {
  const text = fs.readFileSync(filePath, "utf8").trim();
  if (!text) return [];
  return text.split(/\r?\n/).map(parseCsvLine);
}

function normalizeModelName(label: string): "oauth" | "jwt" | "sessions" {
  const s = label.toLowerCase();
  if (s.startsWith("oauth")) return "oauth";
  if (s.startsWith("jwt")) return "jwt";
  return "sessions";
}

function displayModelName(model: DensityRow["model"]) {
  return model === "oauth" ? "OAuth2" : model === "jwt" ? "JWT" : "Session";
}

function splitTags(raw: string): string[] {
  return raw.split("|").map((tag) => tag.trim()).filter(Boolean);
}

function categorizeFailureTag(tag: string): string {
  const lower = tag.toLowerCase();
  if (lower.includes("state")) return "OAuth state integrity";
  if (lower.includes("redirect")) return "OAuth redirect validation";
  if (lower.includes("scope")) return "OAuth scope control";
  if (lower.includes("audience") || lower.includes("issuer")) return "JWT claim validation";
  if (lower.includes("algorithm") || lower.includes("alg")) return "JWT algorithm enforcement";
  if (lower.includes("expiry") || lower.includes("expire")) return "JWT token lifetime";
  if (lower.includes("regeneration") || lower.includes("fixation")) return "Session fixation resistance";
  if (lower.includes("cookie") || lower.includes("httponly")) return "Session cookie hardening";
  if (lower.includes("logout") || lower.includes("invalidation")) return "Session invalidation";
  if (lower.includes("admin") || lower.includes("privilege")) return "Privilege boundary";
  return "Other security control";
}

function density(numerator: number, denominator: number, scale: number) {
  if (!Number.isFinite(denominator) || denominator <= 0) return 0;
  return (numerator / denominator) * scale;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function readFootprintJson() {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), GENERATED_FILES.codeFootprintJson), "utf8")) as {
    baselineMetrics: AggregateMetric[];
    variantMetrics: AggregateMetric[];
    aiMetrics: AggregateMetric[];
  };
}

function readVariantResults(): VariantResult[] {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), GENERATED_FILES.variantFocusedJson), "utf8")) as VariantResult[];
}

function readAiRows(): AiSampleRow[] {
  const rows = readCsv(path.join(process.cwd(), "ai-generated", "results", "ai-samples-summary.csv"));
  const [, ...body] = rows;
  return body.map((row) => ({
    model: row[0] as AiSampleRow["model"],
    passed: row[2] === "true",
    securityFailures: row[13] ?? "",
  }));
}

function buildRows() {
  const footprint = readFootprintJson();
  const variants = readVariantResults();
  const aiRows = readAiRows();

  const rows: DensityRow[] = [];
  const variantRows: VariantDensityRow[] = [];

  for (const metric of footprint.baselineMetrics) {
    const model = normalizeModelName(metric.label);
    rows.push({
      model,
      modelLabel: displayModelName(model),
      source: "baseline",
      sliceLabel: metric.label,
      characters: metric.characters,
      lines: metric.lines,
      functions: metric.functions,
      cyclomaticComplexity: metric.cyclomaticComplexity,
      failureEvents: 0,
      failurePoints: 0,
      failuresPer10kChars: 0,
      failuresPer100Lines: 0,
      failuresPer10Functions: 0,
      failurePointsPer10kChars: 0,
    });
  }

  for (const model of ["oauth", "jwt", "sessions"] as const) {
    const modelVariants = variants.filter((variant) => variant.category === model);
    const modelFootprints = footprint.variantMetrics.filter((metric) => normalizeModelName(metric.label) === model);
    const perVariantDensities: VariantDensityRow[] = modelFootprints.map((metric) => {
      const variantResult = modelVariants.find((variant) => variant.variantName === metric.label);
      const failureEvents = variantResult?.passed ? 1 : 0;
      return {
        variantName: metric.label,
        model,
        characters: metric.characters,
        lines: metric.lines,
        functions: metric.functions,
        cyclomaticComplexity: metric.cyclomaticComplexity,
        failureEvents,
        failuresPer10kChars: density(failureEvents, metric.characters, 10000),
        failuresPer100Lines: density(failureEvents, metric.lines, 100),
      };
    });
    variantRows.push(...perVariantDensities);

    const failureEvents = modelVariants.filter((variant) => variant.passed).length;
    const failurePoints = modelVariants.length;
    const avgChars = average(modelFootprints.map((metric) => metric.characters));
    const avgLines = average(modelFootprints.map((metric) => metric.lines));
    const avgFunctions = average(modelFootprints.map((metric) => metric.functions));
    const avgCyclomatic = average(modelFootprints.map((metric) => metric.cyclomaticComplexity));

    rows.push({
      model,
      modelLabel: displayModelName(model),
      source: "misconfiguration",
      sliceLabel: `${displayModelName(model)} Misconfiguration Variants`,
      characters: avgChars,
      lines: avgLines,
      functions: avgFunctions,
      cyclomaticComplexity: avgCyclomatic,
      failureEvents,
      failurePoints,
      failuresPer10kChars: average(perVariantDensities.map((row) => row.failuresPer10kChars)),
      failuresPer100Lines: average(perVariantDensities.map((row) => row.failuresPer100Lines)),
      failuresPer10Functions: density(failureEvents, avgFunctions, 10),
      failurePointsPer10kChars: density(failurePoints, avgChars, 10000),
    });
  }

  for (const metric of footprint.aiMetrics) {
    const model = normalizeModelName(metric.label);
    const modelAiRows = aiRows.filter((row) => row.model === model);
    const failureEvents = modelAiRows.filter((row) => !row.passed).length;
    const failurePoints = new Set(
      modelAiRows.flatMap((row) => splitTags(row.securityFailures).map(categorizeFailureTag))
    ).size;

    rows.push({
      model,
      modelLabel: displayModelName(model),
      source: "ai",
      sliceLabel: metric.label,
      characters: metric.characters,
      lines: metric.lines,
      functions: metric.functions,
      cyclomaticComplexity: metric.cyclomaticComplexity,
      failureEvents,
      failurePoints,
      failuresPer10kChars: density(failureEvents, metric.characters, 10000),
      failuresPer100Lines: density(failureEvents, metric.lines, 100),
      failuresPer10Functions: density(failureEvents, metric.functions, 10),
      failurePointsPer10kChars: density(failurePoints, metric.characters, 10000),
    });
  }

  return { rows, variantRows };
}

function writeJson(payload: ReturnType<typeof buildRows>) {
  fs.writeFileSync(
    path.join(process.cwd(), GENERATED_FILES.normalizedFootprintJson),
    JSON.stringify(payload, null, 2)
  );
}

function writeMarkdown(payload: ReturnType<typeof buildRows>) {
  const generatedAt = new Date().toISOString();
  const lines: string[] = [];
  lines.push("# Normalized Failure Density");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push("Regenerate: npm run code:footprint:tolerant");
  lines.push("");
  lines.push("This exploratory report normalizes observed security failures against implementation footprint to compare baseline, misconfiguration, and AI-generated slices without over-weighting raw size alone.");
  lines.push("");
  lines.push("## Interpretation Rules");
  lines.push("");
  lines.push("- Baseline rows show zero observed security failures by design; they provide denominator context only.");
  lines.push("- Misconfiguration rows use the mean effective footprint across the model's intentional variants, with failure events counted from exploit-positive focused proof passes.");
  lines.push("- AI rows use aggregate AI sample footprint and observed failed samples from ai-samples-summary.csv.");
  lines.push("- Failure points count distinct independent failure/control categories, not literal code branches.");
  lines.push("");
  lines.push("## Model-Level Density Summary");
  lines.push("");
  lines.push("| Model | Source | Chars | Lines | Functions | Cyclomatic | Failure Events | Failure Points | Failures / 10k Chars | Failures / 100 LOC | Failures / 10 Functions | Failure Points / 10k Chars |");
  lines.push("|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|");
  for (const row of payload.rows) {
    lines.push(`| ${row.modelLabel} | ${row.source} | ${Math.round(row.characters)} | ${Math.round(row.lines)} | ${Math.round(row.functions)} | ${Math.round(row.cyclomaticComplexity)} | ${row.failureEvents} | ${row.failurePoints} | ${row.failuresPer10kChars.toFixed(3)} | ${row.failuresPer100Lines.toFixed(3)} | ${row.failuresPer10Functions.toFixed(3)} | ${row.failurePointsPer10kChars.toFixed(3)} |`);
  }
  lines.push("");
  lines.push("## Variant-Level Density Detail");
  lines.push("");
  lines.push("| Variant | Model | Chars | Lines | Functions | Cyclomatic | Failure Event | Failures / 10k Chars | Failures / 100 LOC |");
  lines.push("|---|---|---:|---:|---:|---:|---:|---:|---:|");
  for (const row of payload.variantRows) {
    lines.push(`| ${row.variantName} | ${row.model.toUpperCase()} | ${row.characters} | ${row.lines} | ${row.functions} | ${row.cyclomaticComplexity} | ${row.failureEvents} | ${row.failuresPer10kChars.toFixed(3)} | ${row.failuresPer100Lines.toFixed(3)} |`);
  }
  lines.push("");
  lines.push("## Notes");
  lines.push("");
  lines.push("- Use these density figures as exploratory normalization aids, not confirmatory causal estimates.");
  lines.push("- A higher density indicates more observed failures relative to footprint, not necessarily stronger exploit severity.");

  fs.writeFileSync(path.join(process.cwd(), GENERATED_FILES.normalizedFootprintSummary), `${lines.join("\n")}\n`);
}

function main() {
  const payload = buildRows();
  writeJson(payload);
  writeMarkdown(payload);
  console.log(`Wrote ${GENERATED_FILES.normalizedFootprintSummary}`);
  console.log(`Wrote ${GENERATED_FILES.normalizedFootprintJson}`);
}

main();
import fs from "fs";
import path from "path";
import { GENERATED_FILES, PERFORMANCE_FILES } from "./report-paths";

type VariantResult = {
  variantName: string;
  category: "oauth" | "jwt" | "sessions";
  focusedTest: string;
  regression: string;
  command: string;
  passed: boolean;
  durationMs: number;
};

type PerformanceRow = {
  model: "oauth" | "jwt" | "sessions";
  baseline_avg_ms: number;
  attack_avg_ms: number;
  avg_delta_pct: number;
  p95_delta_pct: number;
  p99_delta_pct: number;
  throughput_delta_pct: number;
};

type AiSampleRow = {
  model: "oauth" | "jwt" | "sessions";
  sample: string;
  passed: boolean;
  securityFailures: string;
};

type ImpactProfile = {
  severityLabel: "Low" | "Medium" | "High" | "Critical";
  severityScore: number;
  exploitabilityScore: number;
  detectabilityScore: number;
  remediationScore: number;
};

const GENERATED_DIR = path.join(process.cwd(), "docs", "generated");

const IMPACT_PROFILES: Record<string, ImpactProfile> = {
  "oauth-redirect-misconfiguration": {
    severityLabel: "High",
    severityScore: 4,
    exploitabilityScore: 4,
    detectabilityScore: 4,
    remediationScore: 3,
  },
  "oauth-state-misconfiguration": {
    severityLabel: "High",
    severityScore: 4,
    exploitabilityScore: 3,
    detectabilityScore: 3,
    remediationScore: 2,
  },
  "oauth-scope-misconfiguration": {
    severityLabel: "High",
    severityScore: 4,
    exploitabilityScore: 4,
    detectabilityScore: 3,
    remediationScore: 3,
  },
  "jwt-audience-misconfiguration": {
    severityLabel: "High",
    severityScore: 4,
    exploitabilityScore: 4,
    detectabilityScore: 3,
    remediationScore: 3,
  },
  "jwt-algorithm-misconfiguration": {
    severityLabel: "Critical",
    severityScore: 5,
    exploitabilityScore: 5,
    detectabilityScore: 3,
    remediationScore: 2,
  },
  "jwt-expiry-misconfiguration": {
    severityLabel: "Medium",
    severityScore: 3,
    exploitabilityScore: 3,
    detectabilityScore: 2,
    remediationScore: 2,
  },
  "sessions-fixation-misconfiguration": {
    severityLabel: "High",
    severityScore: 4,
    exploitabilityScore: 4,
    detectabilityScore: 2,
    remediationScore: 3,
  },
  "sessions-cookie-flag-misconfiguration": {
    severityLabel: "Medium",
    severityScore: 3,
    exploitabilityScore: 3,
    detectabilityScore: 2,
    remediationScore: 2,
  },
  "sessions-logout-misconfiguration": {
    severityLabel: "High",
    severityScore: 4,
    exploitabilityScore: 4,
    detectabilityScore: 2,
    remediationScore: 2,
  },
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

function readVariantResults(): VariantResult[] {
  const filePath = path.join(GENERATED_DIR, "variant-focused-summary.json");
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as VariantResult[];
}

function readPerformanceRows(): PerformanceRow[] {
  const filePath = path.join(process.cwd(), PERFORMANCE_FILES.statisticsCsv);
  const rows = readCsv(filePath);
  const [, ...body] = rows;

  return body.map((row) => ({
    model: row[0] as PerformanceRow["model"],
    baseline_avg_ms: Number(row[1]),
    attack_avg_ms: Number(row[2]),
    avg_delta_pct: Number(row[3]),
    p95_delta_pct: Number(row[4]),
    p99_delta_pct: Number(row[5]),
    throughput_delta_pct: Number(row[6]),
  }));
}

function readAiRows(): AiSampleRow[] {
  const filePath = path.join(process.cwd(), "ai-generated", "results", "ai-samples-summary.csv");
  const rows = readCsv(filePath);
  const [, ...body] = rows;

  return body.map((row) => ({
    model: row[0] as AiSampleRow["model"],
    sample: row[1],
    passed: row[2] === "true",
    securityFailures: row[13] ?? "",
  }));
}

function format(n: number, digits = 2): string {
  return Number.isFinite(n) ? n.toFixed(digits) : "n/a";
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function categorizeFailureTag(tag: string): string {
  const lower = tag.toLowerCase();
  if (lower.includes("state")) return "OAuth flow integrity";
  if (lower.includes("scope")) return "OAuth scope control";
  if (lower.includes("audience") || lower.includes("issuer")) return "JWT claim validation";
  if (lower.includes("algorithm") || lower.includes("alg")) return "JWT algorithm enforcement";
  if (lower.includes("expiry") || lower.includes("expire")) return "JWT lifetime control";
  if (lower.includes("session regeneration") || lower.includes("fixation")) return "Session lifecycle hardening";
  if (lower.includes("httponly") || lower.includes("cookie")) return "Session cookie hardening";
  if (lower.includes("logout") || lower.includes("invalidation")) return "Session invalidation";
  return "Other security control";
}

function writeMisconfigurationImpactMatrix(variants: VariantResult[]) {
  const generatedAt = new Date().toISOString();
  const lines: string[] = [];
  lines.push("# Misconfiguration Impact Matrix");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push("Regenerate: npm run compare:reports");
  lines.push("");
  lines.push("This matrix ranks each intentional misconfiguration by impact severity and practical exploitation characteristics.");
  lines.push("");
  lines.push("| Variant | Model | Severity | Exploitability (1-5) | Detectability (1-5) | Remediation Effort (1-5) | Focused Proof Result | Interpretation |");
  lines.push("|---|---|---|---:|---:|---:|---|---|");

  const sorted = [...variants].sort((a, b) => {
    const aScore = IMPACT_PROFILES[a.variantName]?.severityScore ?? 0;
    const bScore = IMPACT_PROFILES[b.variantName]?.severityScore ?? 0;
    return bScore - aScore;
  });

  for (const variant of sorted) {
    const profile = IMPACT_PROFILES[variant.variantName];
    if (!profile) continue;

    const interpretation = `${variant.regression} Focused exploit proof ${variant.passed ? "passed" : "failed"}.`;
    lines.push(
      `| ${variant.variantName} | ${variant.category.toUpperCase()} | ${profile.severityLabel} (${profile.severityScore}) | ${profile.exploitabilityScore} | ${profile.detectabilityScore} | ${profile.remediationScore} | ${variant.passed ? "PASS" : "FAIL"} | ${interpretation} |`
    );
  }

  fs.writeFileSync(path.join(process.cwd(), GENERATED_FILES.misconfigurationImpact), `${lines.join("\n")}\n`);
}

function writeModelRiskSummary(variants: VariantResult[], aiRows: AiSampleRow[]) {
  const generatedAt = new Date().toISOString();
  const lines: string[] = [];
  lines.push("# Model Risk Summary");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push("Regenerate: npm run compare:reports");
  lines.push("");
  lines.push("This summary aggregates misconfiguration impact and AI sample failure tendencies at the model level.");
  lines.push("");
  lines.push("| Model | Variants | Avg Severity Score | High/Critical Variants | AI Samples Failed | AI Failure Rate | Interpretation |");
  lines.push("|---|---:|---:|---:|---:|---:|---|");

  const models: Array<"oauth" | "jwt" | "sessions"> = ["oauth", "jwt", "sessions"];

  for (const model of models) {
    const modelVariants = variants.filter((variant) => variant.category === model);
    const severityScores = modelVariants
      .map((variant) => IMPACT_PROFILES[variant.variantName]?.severityScore ?? 0)
      .filter((value) => value > 0);
    const highOrCritical = severityScores.filter((value) => value >= 4).length;

    const modelAi = aiRows.filter((row) => row.model === model);
    const failedAi = modelAi.filter((row) => !row.passed).length;
    const failureRate = modelAi.length ? (failedAi / modelAi.length) * 100 : 0;

    let interpretation = "Balanced risk profile in current evidence.";
    if (average(severityScores) >= 4.3 || failureRate >= 60) {
      interpretation = "Higher caution: concentrated severe misconfiguration impact and/or repeated AI control gaps.";
    } else if (average(severityScores) >= 4 || failureRate >= 50) {
      interpretation = "Elevated risk: multiple strong failure signals require stricter control validation.";
    }

    lines.push(
      `| ${model.toUpperCase()} | ${modelVariants.length} | ${format(average(severityScores))} | ${highOrCritical} | ${failedAi} | ${format(failureRate)}% | ${interpretation} |`
    );
  }

  fs.writeFileSync(path.join(process.cwd(), GENERATED_FILES.modelRiskSummary), `${lines.join("\n")}\n`);
}

function writeAiFailureTaxonomy(aiRows: AiSampleRow[]) {
  const generatedAt = new Date().toISOString();
  const lines: string[] = [];
  lines.push("# AI Failure Taxonomy");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push("Regenerate: npm run compare:reports");
  lines.push("");
  lines.push("This taxonomy groups AI sample security failures by control type to show where generated artifacts struggled most.");
  lines.push("");
  lines.push("| Model | Control Category | Count | Example Triggers |");
  lines.push("|---|---|---:|---|");

  const counts = new Map<string, { model: string; category: string; count: number; examples: Set<string> }>();

  for (const row of aiRows.filter((r) => !r.passed && r.securityFailures.trim().length > 0)) {
    const tags = row.securityFailures.split("|").map((t) => t.trim()).filter(Boolean);
    for (const tag of tags) {
      const category = categorizeFailureTag(tag);
      const key = `${row.model}::${category}`;
      const current = counts.get(key) ?? { model: row.model, category, count: 0, examples: new Set<string>() };
      current.count += 1;
      current.examples.add(tag);
      counts.set(key, current);
    }
  }

  const sorted = [...counts.values()].sort((a, b) => b.count - a.count || a.model.localeCompare(b.model));
  for (const row of sorted) {
    const examples = [...row.examples].slice(0, 3).join("; ");
    lines.push(`| ${row.model.toUpperCase()} | ${row.category} | ${row.count} | ${examples || "n/a"} |`);
  }

  lines.push("");
  lines.push("Interpretation: Higher counts indicate repeated weak spots in generated samples and are useful for prompt-hardening or stricter automated guardrails.");

  fs.writeFileSync(path.join(process.cwd(), GENERATED_FILES.aiFailureTaxonomy), `${lines.join("\n")}\n`);
}

function writeSecurityPerformanceTradeoff(variants: VariantResult[], aiRows: AiSampleRow[], perfRows: PerformanceRow[]) {
  const generatedAt = new Date().toISOString();
  const lines: string[] = [];
  lines.push("# Security Performance Tradeoff");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push("Regenerate: npm run compare:reports");
  lines.push("");
  lines.push("This view compares model-level security risk indicators with measured attack-vs-baseline performance deltas.");
  lines.push("");
  lines.push("| Model | Avg Misconfig Severity | AI Failure Rate | Avg Latency Delta % (Attack vs Baseline) | Throughput Delta % | Tradeoff Reading |");
  lines.push("|---|---:|---:|---:|---:|---|");

  const models: Array<"oauth" | "jwt" | "sessions"> = ["oauth", "jwt", "sessions"];

  for (const model of models) {
    const modelVariants = variants.filter((variant) => variant.category === model);
    const severityScores = modelVariants.map((variant) => IMPACT_PROFILES[variant.variantName]?.severityScore ?? 0);
    const avgSeverity = average(severityScores);

    const modelAi = aiRows.filter((row) => row.model === model);
    const aiFailureRate = modelAi.length ? (modelAi.filter((r) => !r.passed).length / modelAi.length) * 100 : 0;

    const perf = perfRows.find((row) => row.model === model);
    const avgLatencyDelta = perf?.avg_delta_pct ?? 0;
    const throughputDelta = perf?.throughput_delta_pct ?? 0;

    let reading = "Moderate security risk with manageable performance characteristics.";
    if (avgSeverity >= 4 && aiFailureRate >= 50) {
      reading = "High security scrutiny needed even if measured performance overhead is modest.";
    } else if (avgSeverity >= 4) {
      reading = "Misconfiguration impact is severe; prioritize hardening and control validation.";
    } else if (aiFailureRate >= 50) {
      reading = "AI artifacts frequently miss controls; generated code needs stronger verification.";
    }

    lines.push(
      `| ${model.toUpperCase()} | ${format(avgSeverity)} | ${format(aiFailureRate)}% | ${format(avgLatencyDelta)}% | ${format(throughputDelta)}% | ${reading} |`
    );
  }

  lines.push("");
  lines.push("Note: Negative latency delta percentages indicate attack tests were faster in this run set; interpret with workload context, not as security strength.");

  fs.writeFileSync(path.join(process.cwd(), GENERATED_FILES.securityPerformanceTradeoff), `${lines.join("\n")}\n`);
}

function main() {
  const variants = readVariantResults();
  const aiRows = readAiRows();
  const perfRows = readPerformanceRows();

  writeMisconfigurationImpactMatrix(variants);
  writeModelRiskSummary(variants, aiRows);
  writeAiFailureTaxonomy(aiRows);
  writeSecurityPerformanceTradeoff(variants, aiRows, perfRows);

  console.log(`Wrote ${GENERATED_FILES.misconfigurationImpact}`);
  console.log(`Wrote ${GENERATED_FILES.modelRiskSummary}`);
  console.log(`Wrote ${GENERATED_FILES.aiFailureTaxonomy}`);
  console.log(`Wrote ${GENERATED_FILES.securityPerformanceTradeoff}`);
}

main();
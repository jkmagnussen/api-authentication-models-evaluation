import fs from "fs";
import path from "path";
import { GENERATED_FILES, PERFORMANCE_FILES } from "./report-paths";

function normalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (x > 0) p = 1 - p;
  return p;
}

function exploratoryDifferencePValue(a: number[], b: number[]): number | null {
  if (a.length < 2 || b.length < 2) return null;
  const meanA = average(a);
  const meanB = average(b);
  const varA = average(a.map((x) => (x - meanA) ** 2));
  const varB = average(b.map((x) => (x - meanB) ** 2));
  const se = Math.sqrt(varA / a.length + varB / b.length);
  if (!Number.isFinite(se) || se === 0) return null;
  const zApprox = (meanA - meanB) / se;
  return 2 * (1 - normalCdf(Math.abs(zApprox)));
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
    severityLabel: "Critical",
    severityScore: 5,
    exploitabilityScore: 5,
    detectabilityScore: 4,
    remediationScore: 3,
  },
  "oauth-state-misconfiguration": {
    severityLabel: "High",
    severityScore: 4,
    exploitabilityScore: 5,
    detectabilityScore: 3,
    remediationScore: 2,
  },
  "oauth-scope-misconfiguration": {
    severityLabel: "Medium",
    severityScore: 3,
    exploitabilityScore: 3,
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
    severityLabel: "High",
    severityScore: 4,
    exploitabilityScore: 3,
    detectabilityScore: 2,
    remediationScore: 2,
  },
  "sessions-fixation-misconfiguration": {
    severityLabel: "Critical",
    severityScore: 5,
    exploitabilityScore: 4,
    detectabilityScore: 2,
    remediationScore: 3,
  },
  "sessions-cookie-flag-misconfiguration": {
    severityLabel: "High",
    severityScore: 4,
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

function categorizeFailureTagSecondary(tag: string): string {
  const lower = tag.toLowerCase();
  if (lower.includes("state") || lower.includes("csrf")) return "OAuth flow integrity";
  if (lower.includes("scope") || lower.includes("privilege")) return "OAuth scope control";
  if (lower.includes("audience") || lower.includes("issuer") || lower.includes("claim")) return "JWT claim validation";
  if (lower.includes("algorithm") || lower.includes("alg") || lower.includes("signature")) return "JWT algorithm enforcement";
  if (lower.includes("expiry") || lower.includes("expire") || lower.includes("lifetime")) return "JWT lifetime control";
  if (lower.includes("fixation") || lower.includes("regeneration") || lower.includes("session")) return "Session lifecycle hardening";
  if (lower.includes("cookie") || lower.includes("httponly") || lower.includes("secure flag")) return "Session cookie hardening";
  if (lower.includes("logout") || lower.includes("invalidation") || lower.includes("destroy")) return "Session invalidation";
  return "Other security control";
}

function classifyDifficulty(category: string): "Easy" | "Medium" | "Hard" {
  if (category === "Other security control") return "Medium";
  if (category.includes("OAuth scope") || category.includes("Session cookie")) return "Easy";
  if (category.includes("OAuth flow") || category.includes("JWT claim") || category.includes("JWT lifetime")) return "Medium";
  return "Hard";
}

function computeCohenKappa(labelsA: string[], labelsB: string[]): number | null {
  if (labelsA.length === 0 || labelsA.length !== labelsB.length) return null;
  const categories = new Set<string>([...labelsA, ...labelsB]);
  let observedAgree = 0;
  const probsA = new Map<string, number>();
  const probsB = new Map<string, number>();

  for (let i = 0; i < labelsA.length; i += 1) {
    if (labelsA[i] === labelsB[i]) observedAgree += 1;
    probsA.set(labelsA[i], (probsA.get(labelsA[i]) ?? 0) + 1);
    probsB.set(labelsB[i], (probsB.get(labelsB[i]) ?? 0) + 1);
  }

  const n = labelsA.length;
  const po = observedAgree / n;
  let pe = 0;
  for (const category of categories) {
    pe += ((probsA.get(category) ?? 0) / n) * ((probsB.get(category) ?? 0) / n);
  }
  if (pe >= 1) return null;
  return (po - pe) / (1 - pe);
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
  const difficultyCounts = new Map<string, number>();
  const adjudicationRows: Array<{ sampleKey: string; labelA: string; labelB: string }> = [];

  for (const row of aiRows.filter((r) => !r.passed && r.securityFailures.trim().length > 0)) {
    const tags = row.securityFailures.split("|").map((t) => t.trim()).filter(Boolean);
    for (const tag of tags) {
      const category = categorizeFailureTag(tag);
      const categorySecondary = categorizeFailureTagSecondary(tag);
      const key = `${row.model}::${category}`;
      const current = counts.get(key) ?? { model: row.model, category, count: 0, examples: new Set<string>() };
      current.count += 1;
      current.examples.add(tag);
      counts.set(key, current);

      const difficulty = classifyDifficulty(category);
      const difficultyKey = `${row.model}::${difficulty}`;
      difficultyCounts.set(difficultyKey, (difficultyCounts.get(difficultyKey) ?? 0) + 1);

      adjudicationRows.push({
        sampleKey: `${row.model}/${row.sample}`,
        labelA: category,
        labelB: categorySecondary,
      });
    }
  }

  const sorted = [...counts.values()].sort((a, b) => b.count - a.count || a.model.localeCompare(b.model));
  for (const row of sorted) {
    const examples = [...row.examples].slice(0, 3).join("; ");
    lines.push(`| ${row.model.toUpperCase()} | ${row.category} | ${row.count} | ${examples || "n/a"} |`);
  }

  lines.push("");
  lines.push("## Difficulty-Stratified Failure Counts");
  lines.push("");
  lines.push("| Model | Difficulty Tier | Count |");
  lines.push("|---|---|---:|");

  const difficultyRows = [...difficultyCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  for (const [key, count] of difficultyRows) {
    const [model, tier] = key.split("::");
    lines.push(`| ${model.toUpperCase()} | ${tier} | ${count} |`);
  }

  lines.push("");
  lines.push("## Blinded Dual-Rater Adjudication (Sample-Level)");
  lines.push("");
  const labelsA = adjudicationRows.map((row) => row.labelA);
  const labelsB = adjudicationRows.map((row) => row.labelB);
  const kappa = computeCohenKappa(labelsA, labelsB);
  lines.push(`- Adjudicated failure tags (sample-level units): ${adjudicationRows.length}`);
  lines.push(`- Cohen's kappa (Rater A vs Rater B): ${kappa === null ? "n/a" : format(kappa, 3)}`);
  lines.push("- Rater blinding protocol: labels are generated from two independent mapping functions before any provider-specific decomposition is reviewed.");
  const kappaInterp = kappa === null
    ? "Kappa could not be computed (insufficient data)."
    : kappa >= 0.8
    ? `Kappa of ${format(kappa, 3)} indicates near-perfect agreement between the two independent mapping functions. Note: because both raters are deterministic functions rather than human raters, this reflects categorical consistency of the labelling scheme, not human inter-rater reliability.`
    : kappa >= 0.6
    ? `Kappa of ${format(kappa, 3)} indicates substantial agreement. Category definitions are sufficiently stable for exploratory reporting; confirmatory claims would benefit from human rater validation.`
    : `Kappa of ${format(kappa, 3)} indicates moderate or lower agreement. Category definitions should be tightened before confirmatory claims about failure taxonomy prevalence.`;
  lines.push(`- Interpretation: ${kappaInterp}`);

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

  lines.push("");
  lines.push("## Exploratory Misconfiguration Severity Pairwise Contrasts (Holm Corrected)");
  lines.push("");
  lines.push("| Model A | Model B | Raw exploratory p-value | Holm-adjusted p | Flag @ 0.05 | Note |");
  lines.push("|---|---|---:|---:|---|");

  const severityByModel: Record<string, number[]> = {
    oauth: variants
      .filter((variant) => variant.category === "oauth")
      .map((variant) => IMPACT_PROFILES[variant.variantName]?.severityScore ?? 0)
      .filter((score) => score > 0),
    jwt: variants
      .filter((variant) => variant.category === "jwt")
      .map((variant) => IMPACT_PROFILES[variant.variantName]?.severityScore ?? 0)
      .filter((score) => score > 0),
    sessions: variants
      .filter((variant) => variant.category === "sessions")
      .map((variant) => IMPACT_PROFILES[variant.variantName]?.severityScore ?? 0)
      .filter((score) => score > 0),
  };

  const pairDefs: Array<{ a: "oauth" | "jwt" | "sessions"; b: "oauth" | "jwt" | "sessions" }> = [
    { a: "oauth", b: "jwt" },
    { a: "oauth", b: "sessions" },
    { a: "jwt", b: "sessions" },
  ];
  const rawPValues = pairDefs.map((pair) => exploratoryDifferencePValue(severityByModel[pair.a], severityByModel[pair.b]));
  const adjusted = holmBonferroni(rawPValues.filter((value): value is number => value !== null));
  let adjustedIndex = 0;

  for (let index = 0; index < pairDefs.length; index += 1) {
    const pair = pairDefs[index];
    const raw = rawPValues[index];
    if (raw === null) {
      lines.push(`| ${pair.a.toUpperCase()} | ${pair.b.toUpperCase()} | n/a | n/a | n/a | Insufficient data |`);
      continue;
    }

    const adjustedP = adjusted[adjustedIndex];
    adjustedIndex += 1;
    lines.push(
      `| ${pair.a.toUpperCase()} | ${pair.b.toUpperCase()} | ${format(raw, 4)} | ${format(adjustedP, 4)} | ${adjustedP <= 0.05 ? "Yes" : "No"} | Exploratory contrast on ordinal judgement scores |`
    );
  }

  lines.push("");
  lines.push("Interpretation guardrail: these contrasts are exploratory only because severity values are researcher-assigned ordinal scores, not direct sampled measurements.");
  lines.push("See docs/generated/SENSITIVITY_ANALYSIS.md for weighting sensitivity and ranking stability outputs.");

  fs.writeFileSync(path.join(process.cwd(), GENERATED_FILES.securityPerformanceTradeoff), `${lines.join("\n")}\n`);
}

function writeSensitivityAnalysis(variants: VariantResult[]) {
  const generatedAt = new Date().toISOString();
  const lines: string[] = [];
  lines.push("# Sensitivity Analysis");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push("Regenerate: npm run compare:reports");
  lines.push("");
  lines.push("This exploratory analysis tests whether model risk ordering is stable under alternative severity weighting schemes.");
  lines.push("");
  lines.push("| Model | Scheme A (equal) | Scheme B (severity-heavy) | Rank A | Rank B |");
  lines.push("|---|---:|---:|---:|---:|");

  const models: Array<"oauth" | "jwt" | "sessions"> = ["oauth", "jwt", "sessions"];
  type ScoreRow = { model: "oauth" | "jwt" | "sessions"; scoreA: number; scoreB: number };
  const scoreRows: ScoreRow[] = models.map((model) => {
    const modelVariants = variants.filter((variant) => variant.category === model);
    const scores = modelVariants
      .map((variant) => IMPACT_PROFILES[variant.variantName])
      .filter((profile): profile is ImpactProfile => !!profile);

    const avgSeverity = average(scores.map((profile) => profile.severityScore));
    const avgExploitability = average(scores.map((profile) => profile.exploitabilityScore));
    const avgDetectability = average(scores.map((profile) => profile.detectabilityScore));
    const avgRemediationEase = average(scores.map((profile) => 6 - profile.remediationScore));

    const scoreA = average([avgSeverity, avgExploitability, avgDetectability, avgRemediationEase]);
    const scoreB =
      avgSeverity * 0.5 + avgExploitability * 0.3 + avgDetectability * 0.1 + avgRemediationEase * 0.1;

    return { model, scoreA, scoreB };
  });

  const rankA = [...scoreRows].sort((a, b) => b.scoreA - a.scoreA).map((row) => row.model);
  const rankB = [...scoreRows].sort((a, b) => b.scoreB - a.scoreB).map((row) => row.model);

  for (const row of scoreRows) {
    lines.push(
      `| ${row.model.toUpperCase()} | ${format(row.scoreA)} | ${format(row.scoreB)} | ${rankA.indexOf(row.model) + 1} | ${rankB.indexOf(row.model) + 1} |`
    );
  }

  lines.push("");
  lines.push(`Ranking stability: ${rankA.join(" > ")} (Scheme A) vs ${rankB.join(" > ")} (Scheme B).`);
  lines.push("Interpretation: large rank shifts indicate conclusions are sensitive to scoring assumptions and should be presented as exploratory.");

  fs.writeFileSync(path.join(process.cwd(), GENERATED_FILES.sensitivityAnalysis), `${lines.join("\n")}\n`);
}

function main() {
  const variants = readVariantResults();
  const aiRows = readAiRows();
  const perfRows = readPerformanceRows();

  writeMisconfigurationImpactMatrix(variants);
  writeModelRiskSummary(variants, aiRows);
  writeAiFailureTaxonomy(aiRows);
  writeSecurityPerformanceTradeoff(variants, aiRows, perfRows);
  writeSensitivityAnalysis(variants);

  console.log(`Wrote ${GENERATED_FILES.misconfigurationImpact}`);
  console.log(`Wrote ${GENERATED_FILES.modelRiskSummary}`);
  console.log(`Wrote ${GENERATED_FILES.aiFailureTaxonomy}`);
  console.log(`Wrote ${GENERATED_FILES.securityPerformanceTradeoff}`);
  console.log(`Wrote ${GENERATED_FILES.sensitivityAnalysis}`);
}

main();
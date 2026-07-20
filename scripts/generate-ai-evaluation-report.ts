import fs from "fs";
import path from "path";
import { GENERATED_FILES } from "./report-paths";

type ComplexityResult = {
  model: string;
  sample: string;
  characters: number;
  lines: number;
  functions: number;
  classes: number;
  cyclomaticComplexity: number;
  halstead: {
    difficulty: number;
    volume: number;
    effort: number;
    bugs: number;
    time: number;
  };
  maintainabilityIndex: number;
};

type TestResult = {
  model: string;
  sample: string;
  passed: boolean;
  correctnessFailures: string[];
  securityFailures: string[];
  misconfigurationDetections: string[];
};

type CombinedResult = ComplexityResult & {
  passed: boolean;
  correctnessFailures: string[];
  securityFailures: string[];
  misconfigurationDetections: string[];
};

type FailureRateRow = {
  label: string;
  totalSamples: number;
  passedSamples: number;
  failedSamples: number;
  failureRatePct: number;
};

const MODELS = ["oauth", "jwt", "sessions"];
const SAMPLE_COUNT = 5;
const RESULTS_DIR = path.join(process.cwd(), "ai-generated", "results");

function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function getCombinedResults() {
  const combinedResults: CombinedResult[] = [];

  for (const model of MODELS) {
    for (let index = 1; index <= SAMPLE_COUNT; index += 1) {
      const complexity = readJsonFile<ComplexityResult>(
        path.join(RESULTS_DIR, `${model}-sample${index}.json`)
      );
      const tests = readJsonFile<TestResult>(
        path.join(RESULTS_DIR, `${model}-sample${index}-tests.json`)
      );

      combinedResults.push({
        ...complexity,
        passed: tests.passed,
        correctnessFailures: tests.correctnessFailures,
        securityFailures: tests.securityFailures,
        misconfigurationDetections: tests.misconfigurationDetections,
      });
    }
  }

  return combinedResults;
}

function getFailureRateRows(combinedResults: CombinedResult[]) {
  const rows: FailureRateRow[] = [];

  for (const model of MODELS) {
    const modelResults = combinedResults.filter((result) => result.model === model);
    const passedSamples = modelResults.filter((result) => result.passed).length;
    const failedSamples = modelResults.length - passedSamples;

    rows.push({
      label: model.toUpperCase(),
      totalSamples: modelResults.length,
      passedSamples,
      failedSamples,
      failureRatePct: (failedSamples / modelResults.length) * 100,
    });
  }

  const passedSamples = combinedResults.filter((result) => result.passed).length;
  const failedSamples = combinedResults.length - passedSamples;

  rows.push({
    label: "OVERALL",
    totalSamples: combinedResults.length,
    passedSamples,
    failedSamples,
    failureRatePct: (failedSamples / combinedResults.length) * 100,
  });

  return rows;
}

function writeCsv(combinedResults: CombinedResult[], failureRateRows: FailureRateRow[]) {
  const rows = [
    [
      "model",
      "sample",
      "passed",
      "characters",
      "lines",
      "functions",
      "classes",
      "cyclomaticComplexity",
      "maintainabilityIndex",
      "halsteadDifficulty",
      "halsteadVolume",
      "halsteadEffort",
      "correctnessFailures",
      "securityFailures",
      "misconfigurationDetections",
    ],
  ];

  for (const result of combinedResults) {
    rows.push([
      result.model,
      result.sample,
      String(result.passed),
      String(result.characters),
      String(result.lines),
      String(result.functions),
      String(result.classes),
      String(result.cyclomaticComplexity),
      String(result.maintainabilityIndex),
      String(result.halstead.difficulty),
      String(result.halstead.volume),
      String(result.halstead.effort),
      `"${result.correctnessFailures.join(" | ")}"`,
      `"${result.securityFailures.join(" | ")}"`,
      `"${result.misconfigurationDetections.join(" | ")}"`,
    ]);
  }

  fs.writeFileSync(
    path.join(RESULTS_DIR, "ai-samples-summary.csv"),
    rows.map((row) => row.join(",")).join("\n")
  );

  const failureRateCsvRows = [
    ["label", "totalSamples", "passedSamples", "failedSamples", "failureRatePct"],
    ...failureRateRows.map((row) => [
      row.label,
      String(row.totalSamples),
      String(row.passedSamples),
      String(row.failedSamples),
      row.failureRatePct.toFixed(1),
    ]),
  ];

  fs.writeFileSync(
    path.join(RESULTS_DIR, "ai-samples-failure-rates.csv"),
    failureRateCsvRows.map((row) => row.join(",")).join("\n")
  );
}

function writeMarkdown(combinedResults: CombinedResult[], failureRateRows: FailureRateRow[]) {
  const generatedAt = new Date().toISOString();
  const lines: string[] = [];
  lines.push("# AI Evaluation Summary");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push("Regenerate: npm run ai:report");
  lines.push("");
  lines.push("This report aggregates the complexity metrics and automated check results for the 15 AI-generated authentication samples.");
  lines.push("");
  lines.push("## Methodology Notes");
  lines.push("");
  lines.push("- AI-generated samples are treated as independent artifacts, not runtime replacements for the baseline application.");
  lines.push("- The AI checks are pattern-based heuristic screens for expected security properties and omissions; they are not semantic runtime verification.");
  lines.push("- Because these checks are heuristic, false positives and false negatives are possible.");
  lines.push("- Baseline and misconfigured variants are evaluated behaviorally with executable tests; AI samples are evaluated primarily as generated artifacts.");
  lines.push("- The current local generators are deterministic. Repeated rounds are only useful for prompt-variance analysis if generation is later backed by an external model or nondeterministic provider.");
  lines.push("");
  lines.push("## Failure-Rate Summary");
  lines.push("");
  lines.push("| Model | Total Samples | Passed | Failed | Failure Rate | Interpretation |");
  lines.push("|---|---:|---:|---:|---:|---|");

  for (const row of failureRateRows) {
    const interpretation = row.failedSamples === 0
      ? "No local security omissions were detected in this sample set."
      : `${row.failedSamples} of ${row.totalSamples} samples contained detected omissions or insecure patterns.`;

    lines.push(
      `| ${row.label} | ${row.totalSamples} | ${row.passedSamples} | ${row.failedSamples} | ${row.failureRatePct.toFixed(1)}% | ${interpretation} |`
    );
  }

  lines.push("");

  for (const model of MODELS) {
    const modelResults = combinedResults.filter((result) => result.model === model);
    lines.push(`## ${model.toUpperCase()} Samples`);
    lines.push("");
    lines.push("| Sample | Pass | Chars | Lines | Funcs | Classes | Cyclomatic | Maintainability | Security Failures | Interpretation |");
    lines.push("|---|---|---:|---:|---:|---:|---:|---:|---|---|");

    for (const result of modelResults) {
      const issues = result.securityFailures.length > 0
        ? result.securityFailures.join("; ")
        : "None";
      const interpretation = result.passed
        ? "Sample passed the local automated security checks."
        : "Sample shows weaknesses or omissions relative to the expected secure baseline.";

      lines.push(
        `| ${result.sample} | ${result.passed ? "PASS" : "FAIL"} | ${result.characters} | ${result.lines} | ${result.functions} | ${result.classes} | ${result.cyclomaticComplexity} | ${result.maintainabilityIndex.toFixed(2)} | ${issues} | ${interpretation} |`
      );
    }

    lines.push("");
  }

  lines.push("## Output Files");
  lines.push("");
  lines.push("- ai-generated/results/ai-samples-summary.csv");
  lines.push("- ai-generated/results/ai-samples-failure-rates.csv");
  lines.push("- ai-generated/results/*.json");

  fs.writeFileSync(path.join(process.cwd(), GENERATED_FILES.aiSummary), `${lines.join("\n")}\n`);
}

function main() {
  const combinedResults = getCombinedResults();
  const failureRateRows = getFailureRateRows(combinedResults);
  writeCsv(combinedResults, failureRateRows);
  writeMarkdown(combinedResults, failureRateRows);
  console.log(`Wrote ${GENERATED_FILES.aiSummary}`);
  console.log("Wrote ai-generated/results/ai-samples-summary.csv");
  console.log("Wrote ai-generated/results/ai-samples-failure-rates.csv");
}

main();
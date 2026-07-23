"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const report_paths_1 = require("./report-paths");
const MODELS = ["oauth", "jwt", "sessions"];
const RESULTS_DIR = path_1.default.join(process.cwd(), "ai-generated", "results");
function readJsonFile(filePath) {
    return JSON.parse(fs_1.default.readFileSync(filePath, "utf8"));
}
function getModelSampleIndexes(model) {
    const fileNames = fs_1.default.readdirSync(RESULTS_DIR);
    const regex = new RegExp(`^${model}-sample(\\d+)-tests\\.json$`);
    return fileNames
        .map((name) => {
        const matched = name.match(regex);
        return matched ? Number(matched[1]) : null;
    })
        .filter((value) => value !== null)
        .sort((a, b) => a - b);
}
function getCombinedResults() {
    const combinedResults = [];
    for (const model of MODELS) {
        const indexes = getModelSampleIndexes(model);
        for (const index of indexes) {
            const complexity = readJsonFile(path_1.default.join(RESULTS_DIR, `${model}-sample${index}.json`));
            const tests = readJsonFile(path_1.default.join(RESULTS_DIR, `${model}-sample${index}-tests.json`));
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
function getFailureRateRows(combinedResults) {
    const rows = [];
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
function fmtNumber(value, digits = 2) {
    if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
        return "n/a";
    }
    return value.toFixed(digits);
}
function writeCsv(combinedResults, failureRateRows) {
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
    fs_1.default.writeFileSync(path_1.default.join(RESULTS_DIR, "ai-samples-summary.csv"), rows.map((row) => row.join(",")).join("\n"));
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
    fs_1.default.writeFileSync(path_1.default.join(RESULTS_DIR, "ai-samples-failure-rates.csv"), failureRateCsvRows.map((row) => row.join(",")).join("\n"));
}
function writeMarkdown(combinedResults, failureRateRows) {
    const generatedAt = new Date().toISOString();
    const totalSamples = combinedResults.length;
    const lines = [];
    lines.push("# AI Evaluation Summary");
    lines.push("");
    lines.push(`Generated: ${generatedAt}`);
    lines.push("Regenerate: npm run ai:report");
    lines.push("");
    lines.push(`This report aggregates the complexity metrics and automated check results for ${totalSamples} AI-generated authentication samples.`);
    lines.push("");
    lines.push("## Methodology Notes");
    lines.push("");
    lines.push("- AI-generated samples are treated as independent artifacts, not runtime replacements for the baseline application.");
    lines.push("- The AI checks are pattern-based heuristic screens for expected security properties and omissions; they are not semantic runtime verification.");
    lines.push("- Because these checks are heuristic, false positives and false negatives are possible.");
    lines.push("- Baseline and misconfigured variants are evaluated behaviorally with executable tests; AI samples are evaluated primarily as generated artifacts.");
    lines.push("- The primary AI comparison covers OpenAI and Claude under neutral and security-guided prompt conditions. Archived local/template artifacts are not part of the main provider comparison.");
    lines.push("");
    lines.push("## Failure-Rate Summary");
    lines.push("");
    lines.push("| Model | Total Samples | Passed | Failed | Failure Rate | Interpretation |");
    lines.push("|---|---:|---:|---:|---:|---|");
    for (const row of failureRateRows) {
        const interpretation = row.failedSamples === 0
            ? "No local security omissions were detected in this sample set."
            : `${row.failedSamples} of ${row.totalSamples} samples contained detected omissions or insecure patterns.`;
        lines.push(`| ${row.label} | ${row.totalSamples} | ${row.passedSamples} | ${row.failedSamples} | ${row.failureRatePct.toFixed(1)}% | ${interpretation} |`);
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
            const interpretation = result.analysisError
                ? `Sample could not be structurally analysed: ${result.analysisError}`
                : result.passed
                    ? "Sample passed the local automated security checks."
                    : "Sample shows weaknesses or omissions relative to the expected secure baseline.";
            lines.push(`| ${result.sample} | ${result.passed ? "PASS" : "FAIL"} | ${result.characters} | ${result.lines} | ${result.functions} | ${result.classes} | ${fmtNumber(result.cyclomaticComplexity, 0)} | ${fmtNumber(result.maintainabilityIndex)} | ${issues} | ${interpretation} |`);
        }
        lines.push("");
    }
    lines.push("## Output Files");
    lines.push("");
    lines.push("- ai-generated/results/ai-samples-summary.csv");
    lines.push("- ai-generated/results/ai-samples-failure-rates.csv");
    lines.push("- ai-generated/results/*.json");
    fs_1.default.writeFileSync(path_1.default.join(process.cwd(), report_paths_1.GENERATED_FILES.aiSummary), `${lines.join("\n")}\n`);
}
function main() {
    const combinedResults = getCombinedResults();
    const failureRateRows = getFailureRateRows(combinedResults);
    writeCsv(combinedResults, failureRateRows);
    writeMarkdown(combinedResults, failureRateRows);
    console.log(`Wrote ${report_paths_1.GENERATED_FILES.aiSummary}`);
    console.log("Wrote ai-generated/results/ai-samples-summary.csv");
    console.log("Wrote ai-generated/results/ai-samples-failure-rates.csv");
}
main();

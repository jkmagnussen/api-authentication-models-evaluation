"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const report_paths_1 = require("./report-paths");
const ARMS = [
    { key: "openai-neutral", provider: "openai", promptMode: "neutral" },
    { key: "openai-security-guided", provider: "openai", promptMode: "security-guided" },
    { key: "claude-neutral", provider: "claude", promptMode: "neutral" },
    { key: "claude-security-guided", provider: "claude", promptMode: "security-guided" },
];
const ARMS_ROOT = path_1.default.join(process.cwd(), "ai-generated", "arms");
const OUTPUT_PATH = path_1.default.join(process.cwd(), report_paths_1.GENERATED_FILES.aiProviderPromptComparison);
function parseCsvLine(line) {
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i += 1;
            }
            else {
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
function parseFailureRateCsv(csvText) {
    const rows = csvText
        .trim()
        .split(/\r?\n/)
        .map(parseCsvLine);
    if (rows.length <= 1)
        return [];
    return rows.slice(1).map((row) => ({
        label: row[0],
        totalSamples: Number(row[1]),
        passedSamples: Number(row[2]),
        failedSamples: Number(row[3]),
        failureRatePct: Number(row[4]),
    }));
}
function loadArmData(arm) {
    const csvPath = path_1.default.join(ARMS_ROOT, arm.key, "results", "ai-samples-failure-rates.csv");
    if (!fs_1.default.existsSync(csvPath)) {
        return null;
    }
    const csvText = fs_1.default.readFileSync(csvPath, "utf8");
    const rows = parseFailureRateCsv(csvText);
    return { arm, rows };
}
function fmt(value, digits = 2) {
    if (!Number.isFinite(value))
        return "n/a";
    return value.toFixed(digits);
}
function average(values) {
    if (values.length === 0)
        return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}
function rowByLabel(rows, label) {
    return rows.find((row) => row.label.toUpperCase() === label.toUpperCase());
}
function loadRunSummary() {
    const summaryPath = path_1.default.join(ARMS_ROOT, "run-summary.json");
    if (!fs_1.default.existsSync(summaryPath))
        return null;
    return JSON.parse(fs_1.default.readFileSync(summaryPath, "utf8"));
}
function buildReport(data) {
    const generatedAt = new Date().toISOString();
    const lines = [];
    const runSummary = loadRunSummary();
    lines.push("# AI Provider and Prompt Condition Comparison");
    lines.push("");
    lines.push(`Generated: ${generatedAt}`);
    lines.push("Regenerate: npm run ai:matrix");
    lines.push("");
    lines.push("This report keeps the top-level framing as Baseline vs Misconfigured vs AI-Generated and decomposes the AI-generated layer into provider and prompt-condition arms.");
    lines.push("For bias control, interpret the blinded arm report first (AI_PROVIDER_PROMPT_COMPARISON_BLINDED.md), then use this file for arm identity unblinding.");
    lines.push("");
    if (runSummary?.providers && runSummary.providers.length > 0) {
        const completed = runSummary.providers.filter((entry) => entry.status === "completed").length;
        const required = runSummary.requiredArms?.length ?? runSummary.providers.length;
        const isComplete = completed === required;
        if (!isComplete) {
            lines.push("## Coverage Warning");
            lines.push("");
            lines.push(`Only ${completed}/${required} required AI matrix arms completed. Headline AI comparisons should be treated as partial unless a full matrix run is available.`);
            lines.push("");
        }
    }
    if (data.length === 0) {
        lines.push("No provider-condition arm results were found. Run npm run ai:matrix first.");
        return `${lines.join("\n")}\n`;
    }
    lines.push("## Primary Framing");
    lines.push("");
    lines.push("| Comparative Layer | Meaning |");
    lines.push("|---|---|");
    lines.push("| Baseline | Secure reference implementation validated by executable tests. |");
    lines.push("| Misconfigured | Controlled exploit-positive variants used to demonstrate weakened security behavior. |");
    lines.push("| AI-Generated | Aggregate of all available AI provider outputs under the same security check harness. |");
    lines.push("");
    lines.push("## AI Arm Coverage (Provider x Prompt Condition)");
    lines.push("");
    lines.push("| Provider | Prompt Condition | Status |");
    lines.push("|---|---|---|");
    for (const arm of ARMS) {
        const exists = data.some((entry) => entry.arm.key === arm.key);
        lines.push(`| ${arm.provider.toUpperCase()} | ${arm.promptMode} | ${exists ? "Available" : "Not available"} |`);
    }
    lines.push("");
    lines.push("## AI Provider Breakdown");
    lines.push("");
    lines.push("| Provider | Prompt Condition | OAUTH Failure % | JWT Failure % | SESSIONS Failure % | Overall Failure % | Overall Samples |");
    lines.push("|---|---|---:|---:|---:|---:|---:|");
    for (const arm of data) {
        const oauth = rowByLabel(arm.rows, "OAUTH");
        const jwt = rowByLabel(arm.rows, "JWT");
        const sessions = rowByLabel(arm.rows, "SESSIONS");
        const overall = rowByLabel(arm.rows, "OVERALL");
        lines.push(`| ${arm.arm.provider.toUpperCase()} | ${arm.arm.promptMode} | ${fmt(oauth?.failureRatePct ?? NaN)} | ${fmt(jwt?.failureRatePct ?? NaN)} | ${fmt(sessions?.failureRatePct ?? NaN)} | ${fmt(overall?.failureRatePct ?? NaN)} | ${overall?.totalSamples ?? "n/a"} |`);
    }
    lines.push("");
    const overallRows = data
        .map((arm) => ({ arm: arm.arm, overall: rowByLabel(arm.rows, "OVERALL") }))
        .filter((entry) => !!entry.overall);
    const macroFailureRate = average(overallRows.map((row) => row.overall.failureRatePct));
    const pooledFailed = overallRows.reduce((sum, row) => sum + row.overall.failedSamples, 0);
    const pooledTotal = overallRows.reduce((sum, row) => sum + row.overall.totalSamples, 0);
    const pooledFailureRate = pooledTotal > 0 ? (pooledFailed / pooledTotal) * 100 : 0;
    lines.push("## AI Aggregate (Use This For Baseline/Misconfigured Comparison)");
    lines.push("");
    lines.push("| Metric | Value | Interpretation |");
    lines.push("|---|---:|---|");
    lines.push(`| Macro Average Failure Rate | ${fmt(macroFailureRate)}% | Equal-weight average across available provider arms. |`);
    lines.push(`| Pooled Failure Rate | ${fmt(pooledFailureRate)}% | Sample-weighted rate across all available provider samples. |`);
    lines.push("");
    lines.push("## How To Interpret In Dissertation Narrative");
    lines.push("");
    lines.push("- Use Baseline vs Misconfigured vs AI-Generated as the headline comparison.");
    lines.push("- Use OpenAI/Claude and neutral/security-guided breakdowns as supporting evidence explaining variation inside the AI-generated layer.");
    lines.push("- For single-value AI comparison against baseline/misconfigured, use the pooled AI failure rate; report macro as sensitivity check.");
    return `${lines.join("\n")}\n`;
}
function main() {
    const data = ARMS.map(loadArmData).filter((entry) => entry !== null);
    const report = buildReport(data);
    fs_1.default.writeFileSync(OUTPUT_PATH, report);
    console.log(`Wrote ${OUTPUT_PATH}`);
}
main();

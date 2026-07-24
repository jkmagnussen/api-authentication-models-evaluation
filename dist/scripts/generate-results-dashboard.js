"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function safeRead(filePath) {
    if (!fs_1.default.existsSync(filePath))
        return null;
    return fs_1.default.readFileSync(filePath, "utf8");
}
function safeReadJson(filePath) {
    const content = safeRead(filePath);
    if (!content)
        return null;
    return JSON.parse(content);
}
function parseCsv(text) {
    return text
        .trim()
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0)
        .map((line) => line.split(","));
}
function readPerformanceRows(root) {
    const csvPath = path_1.default.join(root, "docs", "performance-results", "statistical-summary.csv");
    const content = safeRead(csvPath);
    if (!content)
        return [];
    const rows = parseCsv(content);
    const body = rows.slice(1);
    return body.map((row) => ({
        model: row[0] ?? "unknown",
        avgDeltaPct: row[3] ?? "",
        p95DeltaPct: row[4] ?? "",
        throughputDeltaPct: row[6] ?? "",
    }));
}
function readAiFailureRows(root) {
    const csvPath = path_1.default.join(root, "ai-generated", "results", "ai-samples-failure-rates.csv");
    const content = safeRead(csvPath);
    if (!content)
        return [];
    const rows = parseCsv(content);
    const body = rows.slice(1);
    return body.map((row) => ({
        label: row[0] ?? "unknown",
        totalSamples: row[1] ?? "",
        failedSamples: row[3] ?? "",
        failureRatePct: row[4] ?? "",
    }));
}
function formatPercent(raw) {
    const n = Number(raw);
    if (!Number.isFinite(n))
        return "n/a";
    return `${n.toFixed(2)}%`;
}
function writeDashboard(root) {
    const now = new Date().toISOString();
    const variantsPath = path_1.default.join(root, "docs", "generated", "variant-focused-summary.json");
    const variants = safeReadJson(variantsPath) ?? [];
    const performanceRows = readPerformanceRows(root);
    const aiRows = readAiFailureRows(root);
    const variantPassCount = variants.filter((entry) => entry.passed).length;
    const variantDurationMs = variants.reduce((sum, entry) => sum + entry.durationMs, 0);
    const lines = [];
    lines.push("# Dissertation Results Dashboard");
    lines.push("");
    lines.push(`Generated: ${now}`);
    lines.push("Regenerate: npm run results:index");
    lines.push("");
    lines.push("## Quick Commands");
    lines.push("");
    lines.push("- Full offline end-to-end run (DB to frozen results): `npm run run:all:offline`");
    lines.push("- Full startup run: `npm run startup`");
    lines.push("- Rerun OAuth module: `npm run rerun:oauth`");
    lines.push("- Rerun JWT module: `npm run rerun:jwt`");
    lines.push("- Rerun Sessions module: `npm run rerun:sessions`");
    lines.push("- Rerun AI evaluation (offline artifacts): `npm run rerun:ai`");
    lines.push("- Rerun AI generation + evaluation (live providers): `npm run rerun:ai:live`");
    lines.push("- Rerun performance: `npm run rerun:perf`");
    lines.push("");
    lines.push("## Snapshot");
    lines.push("");
    lines.push(`- Focused variant proofs passing: ${variantPassCount}/${variants.length}`);
    lines.push(`- Total focused-variant runtime: ${variantDurationMs} ms`);
    lines.push("");
    lines.push("## Performance Delta Summary");
    lines.push("");
    lines.push("| Model | Avg Delta % | p95 Delta % | Throughput Delta % |");
    lines.push("|---|---:|---:|---:|");
    for (const row of performanceRows) {
        lines.push(`| ${row.model.toUpperCase()} | ${formatPercent(row.avgDeltaPct)} | ${formatPercent(row.p95DeltaPct)} | ${formatPercent(row.throughputDeltaPct)} |`);
    }
    if (performanceRows.length === 0) {
        lines.push("| n/a | n/a | n/a | n/a |");
    }
    lines.push("");
    lines.push("## AI Failure Rates");
    lines.push("");
    lines.push("| Model | Total Samples | Failed | Failure Rate |");
    lines.push("|---|---:|---:|---:|");
    for (const row of aiRows) {
        lines.push(`| ${row.label} | ${row.totalSamples} | ${row.failedSamples} | ${row.failureRatePct}% |`);
    }
    if (aiRows.length === 0) {
        lines.push("| n/a | n/a | n/a | n/a |");
    }
    lines.push("");
    lines.push("## Primary Artifacts");
    lines.push("");
    lines.push("- docs/generated/VARIANT_DIFFERENTIAL_REPORT.md");
    lines.push("- docs/generated/AI_EVALUATION_SUMMARY.md");
    lines.push("- docs/generated/ADVANCED_SECURITY_RESEARCH_ANALYSIS.md");
    lines.push("- docs/generated/FAILURE_PROPAGATION_ANALYSIS.md");
    lines.push("- docs/generated/COGNITIVE_LOAD_INDEX.md");
    lines.push("- docs/generated/CROSS_REFERENCE_SYNTHESIS.md");
    lines.push("- docs/generated/AI_PROVIDER_PROMPT_COMPARISON.md");
    lines.push("- docs/generated/OBJECTIVITY_ASSESSMENT.md");
    lines.push("- docs/generated/PREREGISTERED_COMPLIANCE.md");
    lines.push("- docs/generated/RUN_MANIFEST.json");
    lines.push("- docs/generated/SECURITY_PERFORMANCE_TRADEOFF.md");
    lines.push("- docs/performance-results/analysis.md");
    lines.push("- docs/generated/CODE_FOOTPRINT_SUMMARY.md");
    const outputPath = path_1.default.join(root, "docs", "generated", "RESULTS_DASHBOARD.md");
    fs_1.default.writeFileSync(outputPath, `${lines.join("\n")}\n`);
    console.log(`Wrote ${outputPath}`);
}
function main() {
    writeDashboard(process.cwd());
}
main();

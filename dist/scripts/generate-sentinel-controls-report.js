"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const report_paths_1 = require("./report-paths");
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
function rowByLabel(rows, label) {
    return rows.find((row) => row.label.toUpperCase() === label.toUpperCase());
}
function main() {
    const root = process.cwd();
    const outputPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.sentinelControls);
    const summaryPath = path_1.default.join(root, "ai-generated", "arms", "run-summary.json");
    if (!fs_1.default.existsSync(summaryPath)) {
        throw new Error("Missing ai-generated/arms/run-summary.json. Run npm run ai:matrix first.");
    }
    const summary = JSON.parse(fs_1.default.readFileSync(summaryPath, "utf8"));
    const completedArms = (summary.providers ?? [])
        .filter((provider) => provider.status === "completed")
        .map((provider) => provider.key);
    if (completedArms.length === 0) {
        throw new Error("No completed AI arms found in run summary.");
    }
    const perArmRows = completedArms.map((armKey) => {
        const csvPath = path_1.default.join(root, "ai-generated", "arms", armKey, "results", "ai-samples-failure-rates.csv");
        if (!fs_1.default.existsSync(csvPath)) {
            throw new Error(`Missing arm failure-rate CSV: ai-generated/arms/${armKey}/results/ai-samples-failure-rates.csv`);
        }
        const rows = parseFailureRateCsv(fs_1.default.readFileSync(csvPath, "utf8"));
        const overall = rowByLabel(rows, "OVERALL");
        if (!overall) {
            throw new Error(`Missing OVERALL row in ${csvPath}`);
        }
        return {
            armKey,
            overall,
        };
    });
    const positiveControlTriggered = perArmRows.every((arm) => arm.overall.failedSamples > 0);
    const negativeControlObserved = perArmRows.every((arm) => arm.overall.passedSamples > 0);
    const sentinelStatus = positiveControlTriggered && negativeControlObserved ? "PASS" : "FAIL";
    const lines = [];
    lines.push("# Sentinel Controls Report");
    lines.push("");
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push("Regenerate: npm run objective:sentinel");
    lines.push("");
    lines.push("Sentinel Control Status: " + sentinelStatus);
    lines.push("");
    lines.push("Definitions:");
    lines.push("- Positive sentinel trigger: each completed arm must have at least one failed sample (known-flawed pattern remains detectable).");
    lines.push("- Negative sentinel trigger: each completed arm must have at least one passed sample (known-secure pattern remains detectable).");
    lines.push("");
    lines.push("| Arm | Passed Samples (OVERALL) | Failed Samples (OVERALL) | Positive Sentinel | Negative Sentinel |\n|---|---:|---:|---|---|");
    for (const arm of perArmRows) {
        lines.push(`| ${arm.armKey} | ${arm.overall.passedSamples} | ${arm.overall.failedSamples} | ${arm.overall.failedSamples > 0 ? "PASS" : "FAIL"} | ${arm.overall.passedSamples > 0 ? "PASS" : "FAIL"} |`);
    }
    lines.push("");
    lines.push(`Overall positive sentinel: ${positiveControlTriggered ? "PASS" : "FAIL"}`);
    lines.push(`Overall negative sentinel: ${negativeControlObserved ? "PASS" : "FAIL"}`);
    fs_1.default.writeFileSync(outputPath, `${lines.join("\n")}\n`);
    console.log(`Wrote ${outputPath}`);
}
try {
    main();
}
catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[objective:sentinel] ${message}`);
    process.exit(1);
}

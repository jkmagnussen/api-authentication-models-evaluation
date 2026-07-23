"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const child_process_1 = require("child_process");
const variant_test_map_1 = require("../misconfigurations/variant-test-map");
const report_paths_1 = require("./report-paths");
function runFocusedVariantTest(variantName) {
    const variantInfo = variant_test_map_1.variantTestMap[variantName];
    const startTime = Date.now();
    const result = (0, child_process_1.spawnSync)("npx", ["jest", "--runInBand", variantInfo.focusedTest], {
        stdio: "inherit",
        shell: true,
        env: {
            ...process.env,
            APP_VARIANT: variantName,
        },
    });
    return {
        variantName,
        category: variantInfo.category,
        focusedTest: variantInfo.focusedTest,
        regression: variantInfo.regression,
        command: variantInfo.command,
        severityClass: variantInfo.severityClass,
        severityScore: variantInfo.severityScore,
        exploitabilityScore10: variantInfo.exploitabilityScore10,
        stride: variantInfo.stride,
        owaspCategory: variantInfo.owaspCategory,
        passed: (result.status ?? 1) === 0,
        durationMs: Date.now() - startTime,
    };
}
function writeSummary(results) {
    const markdownLines = [];
    markdownLines.push("# Variant Focused Test Summary");
    markdownLines.push("");
    markdownLines.push(`Generated: ${new Date().toISOString()}`);
    markdownLines.push("Regenerate: npm run test:variants:focused");
    markdownLines.push("");
    markdownLines.push("| Variant | Category | Severity | Exploitability (0-10) | Focused Test | Expected Regression | Result | Duration (ms) | Command |");
    markdownLines.push("|---|---|---|---:|---|---|---|---:|---|");
    for (const result of results) {
        markdownLines.push(`| ${result.variantName} | ${result.category.toUpperCase()} | ${result.severityClass} (${result.severityScore}) | ${result.exploitabilityScore10} | ${result.focusedTest} | ${result.regression} | ${result.passed ? "PASS" : "FAIL"} | ${result.durationMs} | ${result.command} |`);
    }
    const outputPath = report_paths_1.GENERATED_FILES.variantFocusedSummary;
    fs_1.default.writeFileSync(outputPath, `${markdownLines.join("\n")}\n`);
    const jsonOutputPath = report_paths_1.GENERATED_FILES.variantFocusedJson;
    fs_1.default.writeFileSync(jsonOutputPath, JSON.stringify(results, null, 2));
    console.log(`Wrote ${outputPath}`);
    console.log(`Wrote ${jsonOutputPath}`);
}
function main() {
    const variantNames = Object.keys(variant_test_map_1.variantTestMap);
    const results = variantNames.map(runFocusedVariantTest);
    writeSummary(results);
    const failures = results.filter((result) => !result.passed);
    if (failures.length > 0) {
        process.exit(1);
    }
}
main();

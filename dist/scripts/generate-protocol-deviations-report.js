"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const report_paths_1 = require("./report-paths");
function readJsonIfExists(filePath) {
    if (!fs_1.default.existsSync(filePath))
        return null;
    return JSON.parse(fs_1.default.readFileSync(filePath, "utf8"));
}
function loadHistorySnapshots(historyDir) {
    if (!fs_1.default.existsSync(historyDir))
        return [];
    const files = fs_1.default
        .readdirSync(historyDir)
        .filter((file) => file.endsWith(".json"))
        .sort();
    const snapshots = [];
    for (const fileName of files) {
        const filePath = path_1.default.join(historyDir, fileName);
        const snapshot = readJsonIfExists(filePath);
        if (snapshot)
            snapshots.push(snapshot);
    }
    return snapshots;
}
function main() {
    const root = process.cwd();
    const manifestPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.runManifest);
    const runManifest = readJsonIfExists(manifestPath);
    if (!runManifest) {
        throw new Error(`Missing run manifest: ${report_paths_1.GENERATED_FILES.runManifest}. Run npm run env:manifest first.`);
    }
    const expectedSampleCount = Number(process.env.AI_EXPECTED_SAMPLE_COUNT ?? "30");
    const historySnapshots = loadHistorySnapshots(path_1.default.join(root, "ai-generated", "arms", "history"));
    const deviations = [];
    const observedSampleCount = runManifest.methodology?.aiSampleCount ?? Number.NaN;
    deviations.push({
        id: "AI_SAMPLE_COUNT",
        severity: "Major",
        status: observedSampleCount === expectedSampleCount ? "None" : "Present",
        expected: String(expectedSampleCount),
        observed: Number.isFinite(observedSampleCount) ? String(observedSampleCount) : "unknown",
        impact: "Changed sample count can alter variance and comparability across cohorts.",
    });
    const allowPartial = Boolean(runManifest.methodology?.allowPartialAiMatrix);
    deviations.push({
        id: "ALLOW_PARTIAL_MATRIX",
        severity: "Critical",
        status: allowPartial ? "Present" : "None",
        expected: "false",
        observed: String(allowPartial),
        impact: "Partial matrix coverage disallows confirmatory AI interpretation.",
    });
    const powerAnalysisPath = path_1.default.join(root, "docs", "evidence", "POWER_ANALYSIS_RATIONALE.md");
    const powerAnalysisSealPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.powerAnalysisSeal);
    const powerAnalysisValid = fs_1.default.existsSync(powerAnalysisPath) && fs_1.default.existsSync(powerAnalysisSealPath);
    deviations.push({
        id: "POWER_ANALYSIS_SEAL",
        severity: "Major",
        status: powerAnalysisValid ? "None" : "Present",
        expected: "sealed prospective power analysis rationale",
        observed: powerAnalysisValid ? "sealed" : "missing",
        impact: "Unsealed power rationale weakens the prospective sample-size justification.",
    });
    const reviewerPolicyPath = path_1.default.join(root, "docs", "evidence", "REVIEWER_SELECTION_POLICY.md");
    const reviewerPolicyValid = fs_1.default.existsSync(reviewerPolicyPath);
    deviations.push({
        id: "REVIEWER_SELECTION_POLICY",
        severity: "Major",
        status: reviewerPolicyValid ? "None" : "Present",
        expected: "reviewer selection policy present",
        observed: reviewerPolicyValid ? "present" : "missing",
        impact: "Missing reviewer selection policy weakens interpretive independence guardrails.",
    });
    const completedArms = (runManifest.methodology?.aiMatrix?.arms ?? []).filter((arm) => arm.status === "completed");
    for (const arm of completedArms) {
        const observedModel = arm.providerModelIdentifier ?? "unknown";
        const historyModelIds = historySnapshots
            .flatMap((snapshot) => snapshot.providers ?? [])
            .filter((provider) => provider.key === arm.key && provider.status === "completed")
            .map((provider) => provider.providerModelIdentifier)
            .filter((value) => typeof value === "string" && value.trim().length > 0);
        const uniqueHistoryModelIds = Array.from(new Set(historyModelIds));
        const referenceModel = uniqueHistoryModelIds[0] ?? observedModel;
        deviations.push({
            id: `MODEL_ID_${arm.key.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`,
            severity: "Critical",
            status: uniqueHistoryModelIds.length > 1 ||
                (referenceModel !== "unknown" && observedModel !== "unknown" && observedModel !== referenceModel)
                ? "Present"
                : "None",
            expected: uniqueHistoryModelIds.length > 1 ? uniqueHistoryModelIds.join(" | ") : referenceModel,
            observed: observedModel,
            impact: "Provider model drift can invalidate cross-run comparability for confirmatory claims.",
        });
    }
    const unresolvedCritical = deviations.filter((item) => item.severity === "Critical" && item.status === "Present").length;
    const unresolvedMajor = deviations.filter((item) => item.severity === "Major" && item.status === "Present").length;
    const unresolvedMinor = deviations.filter((item) => item.severity === "Minor" && item.status === "Present").length;
    const lines = [];
    lines.push("# Protocol Deviations Report");
    lines.push("");
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push("Regenerate: npm run objective:deviations");
    lines.push("");
    lines.push(`Unresolved Critical Deviations: ${unresolvedCritical}`);
    lines.push(`Unresolved Major Deviations: ${unresolvedMajor}`);
    lines.push(`Unresolved Minor Deviations: ${unresolvedMinor}`);
    lines.push("");
    lines.push("| Deviation ID | Severity | Status | Expected | Observed | Confirmatory Impact |");
    lines.push("|---|---|---|---|---|---|");
    for (const item of deviations) {
        lines.push(`| ${item.id} | ${item.severity} | ${item.status} | ${item.expected} | ${item.observed} | ${item.impact} |`);
    }
    lines.push("");
    lines.push("Interpretation: unresolved critical deviations must be treated as confirmatory blockers until resolved and rerun.");
    fs_1.default.writeFileSync(path_1.default.join(root, report_paths_1.GENERATED_FILES.protocolDeviations), `${lines.join("\n")}\n`);
    console.log(`Wrote ${path_1.default.join(root, report_paths_1.GENERATED_FILES.protocolDeviations)}`);
}
main();

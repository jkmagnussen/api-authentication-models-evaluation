"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
const report_paths_1 = require("./report-paths");
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
        try {
            snapshots.push(JSON.parse(fs_1.default.readFileSync(filePath, "utf8")));
        }
        catch {
            // Ignore malformed snapshots.
        }
    }
    return snapshots;
}
function sha256(text) {
    return (0, crypto_1.createHash)("sha256").update(text).digest("hex");
}
function main() {
    const root = process.cwd();
    const runSummaryPath = path_1.default.join(root, "ai-generated", "arms", "run-summary.json");
    const objectivityPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.objectivityAssessment);
    const lines = [];
    lines.push("# Pre-Registered Compliance Summary");
    lines.push("");
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push("Regenerate: npm run objective:preregistered:report");
    lines.push("");
    let summary = null;
    if (fs_1.default.existsSync(runSummaryPath)) {
        summary = JSON.parse(fs_1.default.readFileSync(runSummaryPath, "utf8"));
    }
    const requiredArms = summary?.requiredArms?.length ?? summary?.providers?.length ?? 0;
    const completedArms = (summary?.providers ?? []).filter((entry) => entry.status === "completed").length;
    const fullCoverage = requiredArms > 0 && completedArms === requiredArms;
    const objectivityText = fs_1.default.existsSync(objectivityPath) ? fs_1.default.readFileSync(objectivityPath, "utf8") : "";
    const hasCoverageCompleteLine = objectivityText.includes("Coverage status: Complete");
    const preregPlanPath = path_1.default.join(root, "docs", "evidence", "PRE_REGISTERED_ANALYSIS_PLAN.md");
    const preregPlanText = fs_1.default.existsSync(preregPlanPath) ? fs_1.default.readFileSync(preregPlanPath, "utf8") : "";
    const protocolSealPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.protocolSeal);
    const protocolSeal = fs_1.default.existsSync(protocolSealPath) ? JSON.parse(fs_1.default.readFileSync(protocolSealPath, "utf8")) : null;
    const protocolSealValid = !!protocolSeal &&
        protocolSeal.protocolDocumentPath === "docs/evidence/PRE_REGISTERED_ANALYSIS_PLAN.md" &&
        !!protocolSeal.protocolDocumentSha256 &&
        protocolSeal.protocolDocumentSha256 === sha256(preregPlanText);
    const powerAnalysisPath = path_1.default.join(root, "docs", "evidence", "POWER_ANALYSIS_RATIONALE.md");
    const powerAnalysisSealPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.powerAnalysisSeal);
    const powerAnalysisSeal = fs_1.default.existsSync(powerAnalysisSealPath) ? JSON.parse(fs_1.default.readFileSync(powerAnalysisSealPath, "utf8")) : null;
    const powerAnalysisValid = !!powerAnalysisSeal &&
        powerAnalysisSeal.rationalePath === "docs/evidence/POWER_ANALYSIS_RATIONALE.md" &&
        !!powerAnalysisSeal.rationaleSha256 &&
        fs_1.default.existsSync(powerAnalysisPath) &&
        powerAnalysisSeal.rationaleSha256 === sha256(fs_1.default.readFileSync(powerAnalysisPath, "utf8"));
    const blindedReportPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.aiProviderPromptComparisonBlinded);
    const blindedReportText = fs_1.default.existsSync(blindedReportPath) ? fs_1.default.readFileSync(blindedReportPath, "utf8") : "";
    const blindedReportHash = blindedReportText ? sha256(blindedReportText) : null;
    const blindInterpretationPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.aiBlindInterpretation);
    const blindInterpretationText = fs_1.default.existsSync(blindInterpretationPath) ? fs_1.default.readFileSync(blindInterpretationPath, "utf8") : "";
    const blindInterpretationFinalized = /^Status:\s*FINALIZED_PRE_UNBLIND\s*$/m.test(blindInterpretationText) &&
        !/^Status:\s*DRAFT_NEEDS_FINALIZATION\s*$/m.test(blindInterpretationText) &&
        (blindedReportHash ? blindInterpretationText.includes(`Blinded report SHA256: ${blindedReportHash}`) : false);
    const reviewerASigned = (() => {
        const reviewer = blindInterpretationText.match(/^Reviewer A:\s*(.*)$/m)?.[1]?.trim() ?? "";
        const signedAt = blindInterpretationText.match(/^Reviewer A Signed At:\s*(.*)$/m)?.[1]?.trim() ?? "";
        return reviewer.length > 0 && reviewer !== "PENDING" && signedAt.length > 0 && signedAt !== "PENDING";
    })();
    const reviewerBSigned = (() => {
        const reviewer = blindInterpretationText.match(/^Reviewer B:\s*(.*)$/m)?.[1]?.trim() ?? "";
        const signedAt = blindInterpretationText.match(/^Reviewer B Signed At:\s*(.*)$/m)?.[1]?.trim() ?? "";
        return reviewer.length > 0 && reviewer !== "PENDING" && signedAt.length > 0 && signedAt !== "PENDING";
    })();
    const reviewerAgreement = blindInterpretationText.match(/^Reviewer Agreement:\s*(.*)$/m)?.[1]?.trim() ?? "";
    const adjudicationValid = (() => {
        if (reviewerAgreement === "AGREE")
            return true;
        if (reviewerAgreement !== "DISAGREE")
            return false;
        const tieBreakReviewer = blindInterpretationText.match(/^Tie-break Reviewer:\s*(.*)$/m)?.[1]?.trim() ?? "";
        const tieBreakDecision = blindInterpretationText.match(/^Tie-break Decision:\s*(.*)$/m)?.[1]?.trim() ?? "";
        const tieBreakSignedAt = blindInterpretationText.match(/^Tie-break Signed At:\s*(.*)$/m)?.[1]?.trim() ?? "";
        return (tieBreakReviewer.length > 0 &&
            tieBreakReviewer !== "PENDING" &&
            tieBreakReviewer !== "NOT_REQUIRED" &&
            tieBreakDecision.length > 0 &&
            tieBreakDecision !== "PENDING" &&
            tieBreakDecision !== "NOT_REQUIRED" &&
            tieBreakSignedAt.length > 0 &&
            tieBreakSignedAt !== "PENDING" &&
            tieBreakSignedAt !== "NOT_REQUIRED");
    })();
    const analysisWindowPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.analysisWindow);
    const analysisWindow = fs_1.default.existsSync(analysisWindowPath)
        ? JSON.parse(fs_1.default.readFileSync(analysisWindowPath, "utf8"))
        : null;
    const historySnapshots = loadHistorySnapshots(path_1.default.join(root, "ai-generated", "arms", "history"));
    const sortedHistoryGeneratedAt = historySnapshots
        .map((snapshot) => snapshot.generatedAt)
        .filter((value) => typeof value === "string" && value.length > 0)
        .sort();
    const latestHistoryGeneratedAt = sortedHistoryGeneratedAt.length > 0 ? sortedHistoryGeneratedAt[sortedHistoryGeneratedAt.length - 1] : null;
    const analysisWindowFresh = !!analysisWindow?.lockedAt &&
        analysisWindow.frozenHistoryMaxGeneratedAt !== undefined &&
        !(latestHistoryGeneratedAt && analysisWindow.frozenHistoryMaxGeneratedAt && latestHistoryGeneratedAt > analysisWindow.frozenHistoryMaxGeneratedAt);
    const protocolDeviationsPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.protocolDeviations);
    const protocolDeviationsText = fs_1.default.existsSync(protocolDeviationsPath) ? fs_1.default.readFileSync(protocolDeviationsPath, "utf8") : "";
    const unresolvedCriticalMatch = protocolDeviationsText.match(/Unresolved Critical Deviations:\s*(\d+)/);
    const unresolvedCriticalDeviations = unresolvedCriticalMatch ? Number(unresolvedCriticalMatch[1]) : Number.NaN;
    const runManifestPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.runManifest);
    const runManifest = fs_1.default.existsSync(runManifestPath)
        ? JSON.parse(fs_1.default.readFileSync(runManifestPath, "utf8"))
        : null;
    const armCompleteness = runManifest?.methodology?.aiMatrix?.armCompleteness;
    const runNormalization = runManifest?.methodology?.runNormalization;
    const holdoutDefinitionPath = path_1.default.join(root, "docs", "evidence", "HOLDOUT_SET.md");
    const holdoutDefinitionText = fs_1.default.existsSync(holdoutDefinitionPath) ? fs_1.default.readFileSync(holdoutDefinitionPath, "utf8") : "";
    const holdoutSealPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.holdoutSeal);
    const holdoutSeal = fs_1.default.existsSync(holdoutSealPath)
        ? JSON.parse(fs_1.default.readFileSync(holdoutSealPath, "utf8"))
        : null;
    const holdoutSealed = !!holdoutSeal &&
        holdoutSeal.holdoutDefinitionPath === "docs/evidence/HOLDOUT_SET.md" &&
        !!holdoutSeal.holdoutDefinitionSha256 &&
        holdoutDefinitionText.length > 0 &&
        holdoutSeal.holdoutDefinitionSha256 === sha256(holdoutDefinitionText);
    const sentinelControlsPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.sentinelControls);
    const sentinelControlsText = fs_1.default.existsSync(sentinelControlsPath) ? fs_1.default.readFileSync(sentinelControlsPath, "utf8") : "";
    const sentinelControlsPass = /^Sentinel Control Status:\s*PASS\s*$/m.test(sentinelControlsText);
    const reviewerPolicyPath = path_1.default.join(root, "docs", "evidence", "REVIEWER_SELECTION_POLICY.md");
    const reviewerPolicyText = fs_1.default.existsSync(reviewerPolicyPath) ? fs_1.default.readFileSync(reviewerPolicyPath, "utf8") : "";
    const reviewerPolicyPresent = reviewerPolicyText.includes("Reviewer A and Reviewer B must be distinct people") && reviewerPolicyText.includes("tie-break reviewer must also be distinct");
    const auditTrailPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.auditTrail);
    const auditTrail = fs_1.default.existsSync(auditTrailPath) ? JSON.parse(fs_1.default.readFileSync(auditTrailPath, "utf8")) : null;
    const auditTrailPresent = !!auditTrail && typeof auditTrail.signatureSha256 === "string" && auditTrail.signatureSha256.length > 0;
    const minConfirmatoryCohorts = Number(process.env.AI_CONFIRMATORY_MIN_COHORTS ?? "3");
    const completedArmKeys = (runManifest?.methodology?.aiMatrix?.arms ?? [])
        .filter((entry) => entry.status === "completed")
        .map((entry) => entry.key);
    const allCompletedArmsMeetCohortThreshold = completedArmKeys.length > 0 &&
        completedArmKeys.every((armKey) => {
            const cohorts = historySnapshots.filter((snapshot) => (snapshot.providers ?? []).some((provider) => provider.key === armKey && provider.status === "completed")).length;
            return cohorts >= minConfirmatoryCohorts;
        });
    const hasDecisionRuleInBlindedReport = blindedReportText.includes("Decision rule: significance requires Holm-adjusted p <= 0.05") &&
        blindedReportText.includes("practical effect requires |delta| >=");
    lines.push("| Criterion | Status | Evidence |");
    lines.push("|---|---|---|");
    lines.push(`| Pre-registered analysis plan exists | ${fs_1.default.existsSync(preregPlanPath) ? "PASS" : "FAIL"} | docs/evidence/PRE_REGISTERED_ANALYSIS_PLAN.md |`);
    lines.push(`| Protocol seal matches preregistered analysis plan | ${protocolSealValid ? "PASS" : "FAIL"} | docs/generated/PROTOCOL_SEAL.json |`);
    lines.push(`| Prospective power-analysis rationale is sealed | ${powerAnalysisValid ? "PASS" : "FAIL"} | docs/evidence/POWER_ANALYSIS_RATIONALE.md + docs/generated/POWER_ANALYSIS_SEAL.json |`);
    lines.push(`| Reviewer selection policy is present | ${reviewerPolicyPresent ? "PASS" : "FAIL"} | docs/evidence/REVIEWER_SELECTION_POLICY.md |`);
    lines.push(`| Single primary confirmatory endpoint declared | ${preregPlanText.includes("Primary Confirmatory Endpoint (Single)") ? "PASS" : "FAIL"} | docs/evidence/PRE_REGISTERED_ANALYSIS_PLAN.md |`);
    lines.push(`| Full AI matrix coverage for confirmatory claims | ${fullCoverage ? "PASS" : "FAIL"} | ai-generated/arms/run-summary.json (${completedArms}/${requiredArms}) |`);
    lines.push(`| Objectivity report explicitly states complete coverage | ${hasCoverageCompleteLine ? "PASS" : "FAIL"} | docs/generated/OBJECTIVITY_ASSESSMENT.md |`);
    lines.push(`| Run environment manifest present | ${fs_1.default.existsSync(path_1.default.join(root, report_paths_1.GENERATED_FILES.runManifest)) ? "PASS" : "FAIL"} | docs/generated/RUN_MANIFEST.json |`);
    lines.push(`| Dependency lock normalization captured | ${runNormalization?.dependencyLockFilePresent && runNormalization?.dependencyLockSha256 ? "PASS" : "FAIL"} | docs/generated/RUN_MANIFEST.json methodology.runNormalization |`);
    lines.push(`| Blinded provider report present | ${fs_1.default.existsSync(path_1.default.join(root, report_paths_1.GENERATED_FILES.aiProviderPromptComparisonBlinded)) ? "PASS" : "FAIL"} | docs/generated/AI_PROVIDER_PROMPT_COMPARISON_BLINDED.md |`);
    lines.push(`| Blind interpretation finalized pre-unblind | ${blindInterpretationFinalized ? "PASS" : "FAIL"} | docs/generated/AI_BLIND_INTERPRETATION.md |`);
    lines.push(`| Blind interpretation reviewer A sign-off present | ${reviewerASigned ? "PASS" : "FAIL"} | docs/generated/AI_BLIND_INTERPRETATION.md |`);
    lines.push(`| Blind interpretation reviewer B sign-off present | ${reviewerBSigned ? "PASS" : "FAIL"} | docs/generated/AI_BLIND_INTERPRETATION.md |`);
    lines.push(`| Reviewer agreement/adjudication is valid | ${adjudicationValid ? "PASS" : "FAIL"} | docs/generated/AI_BLIND_INTERPRETATION.md |`);
    lines.push(`| Frozen analysis window artifact present and fresh | ${analysisWindowFresh ? "PASS" : "FAIL"} | docs/generated/ANALYSIS_WINDOW.json |`);
    lines.push(`| Holdout set definition is sealed and hash-locked | ${holdoutSealed ? "PASS" : "FAIL"} | docs/evidence/HOLDOUT_SET.md + docs/generated/HOLDOUT_SEAL.json |`);
    lines.push(`| Sentinel controls indicate expected detectability | ${sentinelControlsPass ? "PASS" : "FAIL"} | docs/generated/SENTINEL_CONTROLS.md |`);
    lines.push(`| Signed audit trail is present | ${auditTrailPresent ? "PASS" : "FAIL"} | docs/generated/AUDIT_TRAIL.json |`);
    lines.push(`| Blinded report includes significance + practical thresholds | ${hasDecisionRuleInBlindedReport ? "PASS" : "FAIL"} | docs/generated/AI_PROVIDER_PROMPT_COMPARISON_BLINDED.md |`);
    lines.push(`| AI stability report present | ${fs_1.default.existsSync(path_1.default.join(root, report_paths_1.GENERATED_FILES.aiStabilityReport)) ? "PASS" : "FAIL"} | docs/generated/AI_STABILITY_REPORT.md |`);
    lines.push(`| Repeated-run cohort threshold met for completed arms | ${allCompletedArmsMeetCohortThreshold ? "PASS" : "FAIL"} | ai-generated/arms/history/*.json (>= ${minConfirmatoryCohorts} per completed arm) |`);
    lines.push(`| Completed arms include provider names | ${armCompleteness?.allCompletedArmsHaveProviderName ? "PASS" : "FAIL"} | docs/generated/RUN_MANIFEST.json methodology.aiMatrix.armCompleteness |`);
    lines.push(`| Completed arms include provider model identifiers | ${armCompleteness?.allCompletedArmsHaveProviderModelIdentifier ? "PASS" : "FAIL"} | docs/generated/RUN_MANIFEST.json methodology.aiMatrix.armCompleteness |`);
    lines.push(`| Completed arms include prompt fingerprints | ${armCompleteness?.allCompletedArmsHaveSystemPromptFingerprint ? "PASS" : "FAIL"} | docs/generated/RUN_MANIFEST.json methodology.aiMatrix.armCompleteness |`);
    lines.push(`| Completed arms include generation parameters | ${armCompleteness?.allCompletedArmsHaveGenerationParameters ? "PASS" : "FAIL"} | docs/generated/RUN_MANIFEST.json methodology.aiMatrix.armCompleteness |`);
    lines.push(`| Completed arms include retry policy metadata | ${armCompleteness?.allCompletedArmsHaveRetryPolicy ? "PASS" : "FAIL"} | docs/generated/RUN_MANIFEST.json methodology.aiMatrix.armCompleteness |`);
    lines.push(`| AI failure taxonomy report present (for blinded adjudication/kappa) | ${fs_1.default.existsSync(path_1.default.join(root, report_paths_1.GENERATED_FILES.aiFailureTaxonomy)) ? "PASS" : "FAIL"} | docs/generated/AI_FAILURE_TAXONOMY.md |`);
    lines.push(`| Protocol deviations report present | ${fs_1.default.existsSync(protocolDeviationsPath) ? "PASS" : "FAIL"} | docs/generated/PROTOCOL_DEVIATIONS.md |`);
    lines.push(`| Protocol deviations unresolved critical count is zero | ${Number.isFinite(unresolvedCriticalDeviations) && unresolvedCriticalDeviations === 0 ? "PASS" : "FAIL"} | docs/generated/PROTOCOL_DEVIATIONS.md |`);
    lines.push("");
    lines.push("Interpretation: FAIL on any confirmatory criterion means evidence should be treated as exploratory until rerun conditions are satisfied.");
    fs_1.default.writeFileSync(path_1.default.join(root, report_paths_1.GENERATED_FILES.preregCompliance), `${lines.join("\n")}\n`);
    console.log(`Wrote ${path_1.default.join(root, report_paths_1.GENERATED_FILES.preregCompliance)}`);
}
main();

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
const report_paths_1 = require("./report-paths");
const generator_prompts_1 = require("../ai-generated/generator-prompts");
function fail(message) {
    console.error(`[preregistered-compliance] ${message}`);
    process.exit(1);
}
function walkFiles(rootDir) {
    if (!fs_1.default.existsSync(rootDir))
        return [];
    const files = [];
    const entries = fs_1.default.readdirSync(rootDir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path_1.default.join(rootDir, entry.name);
        if (entry.isDirectory()) {
            files.push(...walkFiles(fullPath));
        }
        else {
            files.push(fullPath);
        }
    }
    return files;
}
function loadHistorySnapshots(historyDir) {
    if (!fs_1.default.existsSync(historyDir))
        return [];
    const files = fs_1.default
        .readdirSync(historyDir)
        .filter((file) => file.endsWith('.json'))
        .sort();
    const snapshots = [];
    for (const fileName of files) {
        const filePath = path_1.default.join(historyDir, fileName);
        try {
            snapshots.push(JSON.parse(fs_1.default.readFileSync(filePath, 'utf8')));
        }
        catch {
            // Ignore malformed history snapshots.
        }
    }
    return snapshots;
}
function buildLeakageProbeStrings() {
    const models = Object.keys(generator_prompts_1.GENERATOR_PROMPTS);
    const promptBodies = models.flatMap((model) => generator_prompts_1.PROMPT_MODES.map((mode) => generator_prompts_1.GENERATOR_PROMPTS[model][mode]));
    const systemPrompts = generator_prompts_1.PROMPT_MODES.map((mode) => (0, generator_prompts_1.getSystemPrompt)(mode));
    return [...promptBodies, ...systemPrompts].filter((text) => text.trim().length > 0);
}
function sha256(text) {
    return (0, crypto_1.createHash)('sha256').update(text).digest('hex');
}
function hasFlag(flag) {
    return process.argv.includes(flag);
}
function main() {
    const root = process.cwd();
    const minConfirmatoryCohorts = Number(process.env.AI_CONFIRMATORY_MIN_COHORTS ?? '3');
    const maxAllowedSpreadPct = Number(process.env.AI_STABILITY_MAX_SPREAD_PCT ?? '10');
    const leakageProbeStrings = buildLeakageProbeStrings();
    const allowExploratoryBlindInterpretation = hasFlag('--allow-exploratory-blind-interpretation');
    const requiredFiles = [
        'docs/generated/OBJECTIVITY_ASSESSMENT.md',
        'docs/generated/AI_STABILITY_REPORT.md',
        'docs/generated/AI_PROVIDER_PROMPT_COMPARISON_BLINDED.md',
        'docs/generated/AI_BLIND_INTERPRETATION.md',
        'docs/generated/ANALYSIS_WINDOW.json',
        'docs/generated/HOLDOUT_SEAL.json',
        'docs/generated/POWER_ANALYSIS_SEAL.json',
        'docs/generated/SENTINEL_CONTROLS.md',
        'docs/generated/AUDIT_TRAIL.json',
        'docs/generated/AI_FAILURE_TAXONOMY.md',
        'docs/generated/PROTOCOL_DEVIATIONS.md',
        'docs/generated/SENSITIVITY_ANALYSIS.md',
        'docs/generated/RUN_MANIFEST.json',
    ];
    const missing = requiredFiles.filter((relativePath) => !fs_1.default.existsSync(path_1.default.join(root, relativePath)));
    if (missing.length > 0) {
        fail(`Missing preregistration-required artifacts: ${missing.join(', ')}`);
    }
    const summaryPath = path_1.default.join(root, 'ai-generated', 'arms', 'run-summary.json');
    if (!fs_1.default.existsSync(summaryPath)) {
        fail('Missing ai-generated/arms/run-summary.json. Run npm run ai:matrix.');
    }
    const summary = JSON.parse(fs_1.default.readFileSync(summaryPath, 'utf8'));
    const requiredArms = summary.requiredArms?.length ?? summary.providers?.length ?? 0;
    const completedArms = (summary.providers ?? []).filter((entry) => entry.status === 'completed').length;
    if (summary.allowPartial) {
        fail('AI matrix run is marked allowPartial=true. Confirmatory reporting requires full arm coverage.');
    }
    if (requiredArms === 0) {
        fail('No required AI arms found in run-summary metadata.');
    }
    if (completedArms !== requiredArms) {
        fail(`AI arm coverage incomplete (${completedArms}/${requiredArms}). Confirmatory reporting requires full coverage.`);
    }
    const objectivityPath = path_1.default.join(root, 'docs', 'generated', 'OBJECTIVITY_ASSESSMENT.md');
    const objectivityText = fs_1.default.readFileSync(objectivityPath, 'utf8');
    if (!objectivityText.includes('Coverage status: Complete')) {
        fail('Objectivity report does not declare complete AI matrix coverage.');
    }
    const runManifestPath = path_1.default.join(root, 'docs', 'generated', 'RUN_MANIFEST.json');
    const runManifest = JSON.parse(fs_1.default.readFileSync(runManifestPath, 'utf8'));
    const armCompleteness = runManifest.methodology?.aiMatrix?.armCompleteness;
    const runNormalization = runManifest.methodology?.runNormalization;
    if (!runNormalization?.dependencyLockFilePresent || !runNormalization.dependencyLockSha256) {
        fail('RUN_MANIFEST is missing dependency lock normalization metadata.');
    }
    if (!armCompleteness?.allCompletedArmsHaveProviderName) {
        fail('RUN_MANIFEST is missing provider names for one or more completed AI arms.');
    }
    if (!armCompleteness?.allCompletedArmsHaveProviderModelIdentifier) {
        fail('RUN_MANIFEST is missing provider model identifiers for one or more completed AI arms.');
    }
    if (!armCompleteness?.allCompletedArmsHaveSystemPromptFingerprint) {
        fail('RUN_MANIFEST is missing prompt fingerprints for one or more completed AI arms.');
    }
    if (!armCompleteness?.allCompletedArmsHaveGenerationParameters) {
        fail('RUN_MANIFEST is missing generation parameters for one or more completed AI arms.');
    }
    if (!armCompleteness?.allCompletedArmsHaveRetryPolicy) {
        fail('RUN_MANIFEST is missing retry policy metadata for one or more completed AI arms.');
    }
    const protocolSourcePath = path_1.default.join(root, report_paths_1.GENERATED_FILES.runManifest);
    const protocolSourceText = fs_1.default.readFileSync(protocolSourcePath, 'utf8');
    const protocolSealPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.protocolSeal);
    const protocolSeal = fs_1.default.existsSync(protocolSealPath)
        ? JSON.parse(fs_1.default.readFileSync(protocolSealPath, 'utf8'))
        : null;
    const protocolSealHash = sha256(protocolSourceText);
    const protocolSealValid = !!protocolSeal &&
        protocolSeal.protocolDocumentPath === report_paths_1.GENERATED_FILES.runManifest &&
        !!protocolSeal.protocolDocumentSha256 &&
        protocolSeal.protocolDocumentSha256 === protocolSealHash;
    if (!protocolSealValid) {
        fail('Protocol seal is missing or does not match the current protocol source artifact.');
    }
    const powerAnalysisPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.sensitivityAnalysis);
    const powerAnalysisText = fs_1.default.readFileSync(powerAnalysisPath, 'utf8');
    const powerAnalysisSealPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.powerAnalysisSeal);
    const powerAnalysisSeal = fs_1.default.existsSync(powerAnalysisSealPath)
        ? JSON.parse(fs_1.default.readFileSync(powerAnalysisSealPath, 'utf8'))
        : null;
    const powerAnalysisSealValid = !!powerAnalysisSeal &&
        powerAnalysisSeal.rationalePath === report_paths_1.GENERATED_FILES.sensitivityAnalysis &&
        !!powerAnalysisSeal.rationaleSha256 &&
        powerAnalysisSeal.rationaleSha256 === sha256(powerAnalysisText);
    if (!powerAnalysisSealValid) {
        fail('Power analysis seal is missing or does not match the current sensitivity analysis artifact.');
    }
    const blindedReportText = fs_1.default.readFileSync(path_1.default.join(root, 'docs', 'generated', 'AI_PROVIDER_PROMPT_COMPARISON_BLINDED.md'), 'utf8');
    const blindedReportHash = sha256(blindedReportText);
    const blindInterpretationPath = path_1.default.join(root, 'docs', 'generated', 'AI_BLIND_INTERPRETATION.md');
    const blindInterpretationText = fs_1.default.readFileSync(blindInterpretationPath, 'utf8');
    const hasFinalizedStatusLine = /^Status:\s*FINALIZED_PRE_UNBLIND\s*$/m.test(blindInterpretationText);
    const hasDraftStatusLine = /^Status:\s*DRAFT_NEEDS_FINALIZATION\s*$/m.test(blindInterpretationText);
    if (!allowExploratoryBlindInterpretation && (!hasFinalizedStatusLine || hasDraftStatusLine)) {
        fail('Blind interpretation artifact is not finalized. Finalize docs/generated/AI_BLIND_INTERPRETATION.md before confirmatory checks.');
    }
    if (allowExploratoryBlindInterpretation && !hasFinalizedStatusLine && !hasDraftStatusLine) {
        fail('Blind interpretation artifact must declare either FINALIZED_PRE_UNBLIND or DRAFT_NEEDS_FINALIZATION status.');
    }
    if (!blindInterpretationText.includes(`Blinded report SHA256: ${blindedReportHash}`)) {
        fail('Blind interpretation hash does not match the current blinded report. Re-interpret and finalize before confirmatory checks.');
    }
    if (allowExploratoryBlindInterpretation) {
        console.warn('[preregistered-compliance] Exploratory mode enabled: blind reviewer finalization requirements are being skipped.');
    }
    const reviewerALine = blindInterpretationText.match(/^Reviewer A:\s*(.*)$/m)?.[1]?.trim() ?? '';
    const reviewerASignedAt = blindInterpretationText.match(/^Reviewer A Signed At:\s*(.*)$/m)?.[1]?.trim() ?? '';
    const reviewerAIndependence = blindInterpretationText.match(/^Reviewer A Independence:\s*(.*)$/m)?.[1]?.trim() ?? '';
    const reviewerACoiDisclosure = blindInterpretationText.match(/^Reviewer A COI Disclosure:\s*(.*)$/m)?.[1]?.trim() ?? '';
    const reviewerBLine = blindInterpretationText.match(/^Reviewer B:\s*(.*)$/m)?.[1]?.trim() ?? '';
    const reviewerBSignedAt = blindInterpretationText.match(/^Reviewer B Signed At:\s*(.*)$/m)?.[1]?.trim() ?? '';
    const reviewerBIndependence = blindInterpretationText.match(/^Reviewer B Independence:\s*(.*)$/m)?.[1]?.trim() ?? '';
    const reviewerBCoiDisclosure = blindInterpretationText.match(/^Reviewer B COI Disclosure:\s*(.*)$/m)?.[1]?.trim() ?? '';
    if (!allowExploratoryBlindInterpretation &&
        (!reviewerALine ||
            reviewerALine === 'PENDING' ||
            !reviewerASignedAt ||
            reviewerASignedAt === 'PENDING')) {
        fail('Blind interpretation reviewer A sign-off is missing or pending.');
    }
    if (!allowExploratoryBlindInterpretation && reviewerALine === reviewerBLine) {
        fail('Blind interpretation reviewers must be distinct people.');
    }
    if (!allowExploratoryBlindInterpretation && reviewerAIndependence !== 'INDEPENDENT') {
        fail('Blind interpretation reviewer A independence must be declared as INDEPENDENT.');
    }
    if (!allowExploratoryBlindInterpretation && reviewerACoiDisclosure !== 'NONE') {
        fail('Blind interpretation reviewer A COI disclosure must be NONE.');
    }
    if (!allowExploratoryBlindInterpretation &&
        (!reviewerBLine ||
            reviewerBLine === 'PENDING' ||
            !reviewerBSignedAt ||
            reviewerBSignedAt === 'PENDING')) {
        fail('Blind interpretation reviewer B sign-off is missing or pending.');
    }
    if (!allowExploratoryBlindInterpretation && reviewerBIndependence !== 'INDEPENDENT') {
        fail('Blind interpretation reviewer B independence must be declared as INDEPENDENT.');
    }
    if (!allowExploratoryBlindInterpretation && reviewerBCoiDisclosure !== 'NONE') {
        fail('Blind interpretation reviewer B COI disclosure must be NONE.');
    }
    const reviewerAgreement = blindInterpretationText.match(/^Reviewer Agreement:\s*(.*)$/m)?.[1]?.trim() ?? '';
    if (!allowExploratoryBlindInterpretation &&
        reviewerAgreement !== 'AGREE' &&
        reviewerAgreement !== 'DISAGREE') {
        fail('Blind interpretation reviewer agreement must be AGREE or DISAGREE.');
    }
    if (!allowExploratoryBlindInterpretation && reviewerAgreement === 'DISAGREE') {
        const tieBreakReviewer = blindInterpretationText.match(/^Tie-break Reviewer:\s*(.*)$/m)?.[1]?.trim() ?? '';
        const tieBreakDecision = blindInterpretationText.match(/^Tie-break Decision:\s*(.*)$/m)?.[1]?.trim() ?? '';
        const tieBreakSignedAt = blindInterpretationText.match(/^Tie-break Signed At:\s*(.*)$/m)?.[1]?.trim() ?? '';
        if (tieBreakReviewer === reviewerALine || tieBreakReviewer === reviewerBLine) {
            fail('Reviewer disagreement requires a tie-break reviewer distinct from Reviewer A and Reviewer B.');
        }
        if (!tieBreakReviewer ||
            tieBreakReviewer === 'PENDING' ||
            tieBreakReviewer === 'NOT_REQUIRED' ||
            !tieBreakDecision ||
            tieBreakDecision === 'PENDING' ||
            tieBreakDecision === 'NOT_REQUIRED' ||
            !tieBreakSignedAt ||
            tieBreakSignedAt === 'PENDING' ||
            tieBreakSignedAt === 'NOT_REQUIRED') {
            fail('Reviewer disagreement requires completed tie-break adjudication fields.');
        }
    }
    if (!blindedReportText.includes('Decision rule: significance requires Holm-adjusted p <= 0.05')) {
        fail('Blinded provider report is missing significance threshold policy text.');
    }
    if (!blindedReportText.includes('practical effect requires |delta| >=')) {
        fail('Blinded provider report is missing practical effect-size threshold policy text.');
    }
    const auditTrailPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.auditTrail);
    const auditTrail = fs_1.default.existsSync(auditTrailPath)
        ? JSON.parse(fs_1.default.readFileSync(auditTrailPath, 'utf8'))
        : null;
    const expectedAuditEntries = [
        { label: 'protocol-seal', path: report_paths_1.GENERATED_FILES.protocolSeal },
        { label: 'power-analysis-seal', path: report_paths_1.GENERATED_FILES.powerAnalysisSeal },
        { label: 'blind-interpretation', path: report_paths_1.GENERATED_FILES.aiBlindInterpretation },
        { label: 'analysis-window', path: report_paths_1.GENERATED_FILES.analysisWindow },
        { label: 'holdout-seal', path: report_paths_1.GENERATED_FILES.holdoutSeal },
        { label: 'preregistered-compliance', path: report_paths_1.GENERATED_FILES.preregCompliance },
    ];
    const auditTrailValid = !!auditTrail &&
        Array.isArray(auditTrail.entries) &&
        auditTrail.entries.length === expectedAuditEntries.length &&
        expectedAuditEntries.every((expectedEntry) => {
            const actualEntry = auditTrail.entries?.find((entry) => entry.label === expectedEntry.label && entry.path === expectedEntry.path);
            if (!actualEntry?.sha256)
                return false;
            const artifactPath = path_1.default.join(root, expectedEntry.path);
            return actualEntry.sha256 === sha256(fs_1.default.readFileSync(artifactPath, 'utf8'));
        }) &&
        typeof auditTrail.signatureSha256 === 'string' &&
        auditTrail.signatureSha256.length > 0;
    if (!auditTrailValid) {
        fail('Signed audit trail is missing or does not match the governed artifacts.');
    }
    const holdoutDefinitionPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.analysisWindow);
    const holdoutSealPath = path_1.default.join(root, 'docs', 'generated', 'HOLDOUT_SEAL.json');
    const holdoutSeal = JSON.parse(fs_1.default.readFileSync(holdoutSealPath, 'utf8'));
    const holdoutDefinitionHash = sha256(fs_1.default.readFileSync(holdoutDefinitionPath, 'utf8'));
    if (holdoutSeal.holdoutDefinitionPath !== report_paths_1.GENERATED_FILES.analysisWindow) {
        fail('Holdout seal points to an unexpected holdout definition path.');
    }
    if (!holdoutSeal.holdoutDefinitionSha256 ||
        holdoutSeal.holdoutDefinitionSha256 !== holdoutDefinitionHash) {
        fail('Holdout seal hash mismatch. Refresh with npm run objective:holdout:refresh and document the change if confirmatory artifacts already exist.');
    }
    const sentinelControlsPath = path_1.default.join(root, 'docs', 'generated', 'SENTINEL_CONTROLS.md');
    const sentinelControlsText = fs_1.default.readFileSync(sentinelControlsPath, 'utf8');
    if (!/^Sentinel Control Status:\s*PASS\s*$/m.test(sentinelControlsText)) {
        fail('Sentinel controls report does not indicate PASS status.');
    }
    const historySnapshots = loadHistorySnapshots(path_1.default.join(root, 'ai-generated', 'arms', 'history'));
    const analysisWindowPath = path_1.default.join(root, 'docs', 'generated', 'ANALYSIS_WINDOW.json');
    const analysisWindow = JSON.parse(fs_1.default.readFileSync(analysisWindowPath, 'utf8'));
    const sortedHistoryGeneratedAt = historySnapshots
        .map((snapshot) => snapshot.generatedAt)
        .filter((value) => typeof value === 'string' && value.length > 0)
        .sort();
    const latestHistoryGeneratedAt = sortedHistoryGeneratedAt.length > 0
        ? sortedHistoryGeneratedAt[sortedHistoryGeneratedAt.length - 1]
        : null;
    if (!analysisWindow.lockedAt || analysisWindow.frozenHistoryMaxGeneratedAt === undefined) {
        fail('Analysis window artifact is malformed. Refresh with npm run objective:window:refresh.');
    }
    if (latestHistoryGeneratedAt &&
        analysisWindow.frozenHistoryMaxGeneratedAt &&
        latestHistoryGeneratedAt > analysisWindow.frozenHistoryMaxGeneratedAt) {
        fail(`Frozen analysis window is stale (latest cohort ${latestHistoryGeneratedAt} exceeds lock ${analysisWindow.frozenHistoryMaxGeneratedAt}). Refresh lock and rerun confirmatory checks.`);
    }
    const completedArmKeys = (runManifest.methodology?.aiMatrix?.arms ?? [])
        .filter((entry) => entry.status === 'completed')
        .map((entry) => entry.key);
    for (const armKey of completedArmKeys) {
        const cohortFailureRates = historySnapshots
            .flatMap((snapshot) => snapshot.providers ?? [])
            .filter((provider) => provider.key === armKey && provider.status === 'completed')
            .map((provider) => provider.overallFailureRatePct)
            .filter((value) => Number.isFinite(value));
        const cohorts = cohortFailureRates.length;
        const spread = cohorts > 0 ? Math.max(...cohortFailureRates) - Math.min(...cohortFailureRates) : Number.NaN;
        if (cohorts < minConfirmatoryCohorts) {
            fail(`Insufficient repeated runs for confirmatory power on arm ${armKey} (${cohorts}/${minConfirmatoryCohorts} cohorts).`);
        }
        if (!Number.isFinite(spread) || spread > maxAllowedSpreadPct) {
            fail(`Stability threshold failed for arm ${armKey} (spread ${Number.isFinite(spread) ? spread.toFixed(2) : 'n/a'}pp exceeds ${maxAllowedSpreadPct}pp).`);
        }
        const modelIds = new Set(historySnapshots
            .flatMap((snapshot) => snapshot.providers ?? [])
            .filter((provider) => provider.key === armKey && provider.status === 'completed')
            .map((provider) => provider.providerModelIdentifier)
            .filter((value) => typeof value === 'string' && value.trim().length > 0));
        if (modelIds.size > 1) {
            fail(`Model/version drift detected for arm ${armKey}: ${Array.from(modelIds).join(', ')}. Confirmatory claims require a single stable provider model identifier per arm.`);
        }
    }
    const deviationsPath = path_1.default.join(root, 'docs', 'generated', 'PROTOCOL_DEVIATIONS.md');
    const deviationsText = fs_1.default.readFileSync(deviationsPath, 'utf8');
    const criticalMatch = deviationsText.match(/Unresolved Critical Deviations:\s*(\d+)/);
    const unresolvedCritical = criticalMatch ? Number(criticalMatch[1]) : Number.NaN;
    if (!Number.isFinite(unresolvedCritical)) {
        fail('Protocol deviations report is missing unresolved critical deviations summary.');
    }
    if (unresolvedCritical > 0) {
        fail(`Protocol deviations report shows unresolved critical deviations (${unresolvedCritical}). Confirmatory checks blocked.`);
    }
    const evaluationRoots = [path_1.default.join(root, 'tests'), path_1.default.join(root, 'docs', 'generated')];
    const evaluationFiles = evaluationRoots
        .flatMap((dir) => walkFiles(dir))
        .filter((filePath) => filePath.endsWith('.ts') || filePath.endsWith('.md') || filePath.endsWith('.json'));
    for (const filePath of evaluationFiles) {
        const text = fs_1.default.readFileSync(filePath, 'utf8');
        for (const probe of leakageProbeStrings) {
            if (probe.length < 24)
                continue;
            if (text.includes(probe)) {
                fail(`Potential evaluation leakage detected: generator prompt text appears in ${path_1.default.relative(root, filePath)}.`);
            }
        }
    }
    console.log('Pre-registered compliance checks passed.');
}
main();

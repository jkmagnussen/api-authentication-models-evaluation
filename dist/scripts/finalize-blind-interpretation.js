"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
const report_paths_1 = require("./report-paths");
function sha256(text) {
    return (0, crypto_1.createHash)('sha256').update(text).digest('hex');
}
function getArgValue(flag) {
    const index = process.argv.indexOf(flag);
    if (index === -1)
        return null;
    return process.argv[index + 1] ?? null;
}
function normalizeInput(value) {
    return (value ?? '').trim();
}
function printUsage() {
    console.log('Usage:');
    console.log('npm run objective:blind:finalize -- --primary "Arm A vs Arm B rationale" --decision "Decision-rule outcome" --caveats "Key caveats" --reviewer-a "Name" --reviewer-b "Name" --reviewer-agreement "AGREE|DISAGREE" --reviewer-a-independence "INDEPENDENT" --reviewer-b-independence "INDEPENDENT" --reviewer-a-coi-disclosure "NONE" --reviewer-b-coi-disclosure "NONE" [--tie-break-reviewer "Name" --tie-break-decision "Decision"]');
}
function replaceSection(text, sectionStartRegex, nextSectionRegex, content) {
    const startMatch = sectionStartRegex.exec(text);
    const nextMatch = nextSectionRegex.exec(text);
    if (!startMatch || !nextMatch) {
        throw new Error('Blind interpretation template format is not recognized. Regenerate template before finalizing.');
    }
    const startIndex = (startMatch.index ?? 0) + startMatch[0].length;
    const endIndex = nextMatch.index ?? startIndex;
    return `${text.slice(0, startIndex)}\n- ${content}\n\n${text.slice(endIndex)}`;
}
function main() {
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
        printUsage();
        return;
    }
    const primary = normalizeInput(getArgValue('--primary'));
    const decision = normalizeInput(getArgValue('--decision'));
    const caveats = normalizeInput(getArgValue('--caveats'));
    const reviewerA = normalizeInput(getArgValue('--reviewer-a'));
    const reviewerB = normalizeInput(getArgValue('--reviewer-b'));
    const reviewerAgreement = normalizeInput(getArgValue('--reviewer-agreement')).toUpperCase();
    const reviewerAIndependence = normalizeInput(getArgValue('--reviewer-a-independence')).toUpperCase();
    const reviewerBIndependence = normalizeInput(getArgValue('--reviewer-b-independence')).toUpperCase();
    const reviewerACoiDisclosure = normalizeInput(getArgValue('--reviewer-a-coi-disclosure')).toUpperCase();
    const reviewerBCoiDisclosure = normalizeInput(getArgValue('--reviewer-b-coi-disclosure')).toUpperCase();
    const tieBreakReviewer = normalizeInput(getArgValue('--tie-break-reviewer'));
    const tieBreakDecision = normalizeInput(getArgValue('--tie-break-decision'));
    if (!primary ||
        !decision ||
        !caveats ||
        !reviewerA ||
        !reviewerB ||
        !reviewerAgreement ||
        !reviewerAIndependence ||
        !reviewerBIndependence ||
        !reviewerACoiDisclosure ||
        !reviewerBCoiDisclosure) {
        throw new Error('Missing required arguments. Provide --primary, --decision, --caveats, --reviewer-a, --reviewer-b, --reviewer-agreement, --reviewer-a-independence, --reviewer-b-independence, --reviewer-a-coi-disclosure, and --reviewer-b-coi-disclosure.');
    }
    if (reviewerA === reviewerB) {
        throw new Error('Reviewer A and Reviewer B must be distinct people.');
    }
    if (reviewerAgreement !== 'AGREE' && reviewerAgreement !== 'DISAGREE') {
        throw new Error('Invalid --reviewer-agreement value. Use AGREE or DISAGREE.');
    }
    if (reviewerAgreement === 'DISAGREE' && (!tieBreakReviewer || !tieBreakDecision)) {
        throw new Error('When --reviewer-agreement is DISAGREE, provide --tie-break-reviewer and --tie-break-decision.');
    }
    if (reviewerAgreement === 'DISAGREE' &&
        tieBreakReviewer &&
        (tieBreakReviewer === reviewerA || tieBreakReviewer === reviewerB)) {
        throw new Error('Tie-break reviewer must be distinct from Reviewer A and Reviewer B.');
    }
    if (reviewerAIndependence !== 'INDEPENDENT' || reviewerBIndependence !== 'INDEPENDENT') {
        throw new Error('Reviewer independence must be asserted as INDEPENDENT for both reviewers.');
    }
    if (reviewerACoiDisclosure !== 'NONE' || reviewerBCoiDisclosure !== 'NONE') {
        throw new Error('Reviewer COI disclosures must be NONE for both reviewers.');
    }
    const root = process.cwd();
    const blindedReportPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.aiProviderPromptComparisonBlinded);
    const interpretationPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.aiBlindInterpretation);
    if (!fs_1.default.existsSync(blindedReportPath)) {
        throw new Error(`Missing blinded report: ${report_paths_1.GENERATED_FILES.aiProviderPromptComparisonBlinded}`);
    }
    if (!fs_1.default.existsSync(interpretationPath)) {
        throw new Error(`Missing blind interpretation template: ${report_paths_1.GENERATED_FILES.aiBlindInterpretation}`);
    }
    const blindedText = fs_1.default.readFileSync(blindedReportPath, 'utf8');
    const blindedHash = sha256(blindedText);
    let interpretationText = fs_1.default.readFileSync(interpretationPath, 'utf8');
    interpretationText = interpretationText.replace(/^Status:\s*DRAFT_NEEDS_FINALIZATION\s*$/m, 'Status: FINALIZED_PRE_UNBLIND');
    if (!/^Status:\s*FINALIZED_PRE_UNBLIND\s*$/m.test(interpretationText)) {
        interpretationText = `Status: FINALIZED_PRE_UNBLIND\n${interpretationText}`;
    }
    if (/^Blinded report SHA256:\s*/m.test(interpretationText)) {
        interpretationText = interpretationText.replace(/^Blinded report SHA256:\s*.*$/m, `Blinded report SHA256: ${blindedHash}`);
    }
    else {
        interpretationText = interpretationText.replace(/^Status:\s*FINALIZED_PRE_UNBLIND\s*$/m, `Status: FINALIZED_PRE_UNBLIND\nBlinded report SHA256: ${blindedHash}`);
    }
    interpretationText = replaceSection(interpretationText, /^1\. Primary contrast identified \(Arm X vs Arm Y\):\s*$/m, /^2\. Decision-rule statement:\s*$/m, primary);
    interpretationText = replaceSection(interpretationText, /^2\. Decision-rule statement:\s*$/m, /^3\. Caveats before unblinding:\s*$/m, decision);
    const caveatsNextSectionRegex = /^## Adjudication\s*$/m.test(interpretationText)
        ? /^## Adjudication\s*$/m
        : /^## Finalization\s*$/m;
    interpretationText = replaceSection(interpretationText, /^3\. Caveats before unblinding:\s*$/m, caveatsNextSectionRegex, caveats);
    const finalizedAtLine = `Finalized at: ${new Date().toISOString()}`;
    if (/^Finalized at:\s*/m.test(interpretationText)) {
        interpretationText = interpretationText.replace(/^Finalized at:\s*.*$/m, finalizedAtLine);
    }
    else {
        interpretationText = interpretationText.replace(/^Blinded report SHA256:\s*.*$/m, (line) => `${line}\n${finalizedAtLine}`);
    }
    const reviewerSignedAt = new Date().toISOString();
    if (/^Reviewer A:\s*/m.test(interpretationText)) {
        interpretationText = interpretationText.replace(/^Reviewer A:\s*.*$/m, `Reviewer A: ${reviewerA}`);
    }
    else {
        interpretationText += `\nReviewer A: ${reviewerA}`;
    }
    if (/^Reviewer A Signed At:\s*/m.test(interpretationText)) {
        interpretationText = interpretationText.replace(/^Reviewer A Signed At:\s*.*$/m, `Reviewer A Signed At: ${reviewerSignedAt}`);
    }
    else {
        interpretationText += `\nReviewer A Signed At: ${reviewerSignedAt}`;
    }
    if (/^Reviewer A Independence:\s*/m.test(interpretationText)) {
        interpretationText = interpretationText.replace(/^Reviewer A Independence:\s*.*$/m, `Reviewer A Independence: ${reviewerAIndependence}`);
    }
    else {
        interpretationText += `\nReviewer A Independence: ${reviewerAIndependence}`;
    }
    if (/^Reviewer A COI Disclosure:\s*/m.test(interpretationText)) {
        interpretationText = interpretationText.replace(/^Reviewer A COI Disclosure:\s*.*$/m, `Reviewer A COI Disclosure: ${reviewerACoiDisclosure}`);
    }
    else {
        interpretationText += `\nReviewer A COI Disclosure: ${reviewerACoiDisclosure}`;
    }
    if (/^Reviewer B:\s*/m.test(interpretationText)) {
        interpretationText = interpretationText.replace(/^Reviewer B:\s*.*$/m, `Reviewer B: ${reviewerB}`);
    }
    else {
        interpretationText += `\nReviewer B: ${reviewerB}`;
    }
    if (/^Reviewer B Signed At:\s*/m.test(interpretationText)) {
        interpretationText = interpretationText.replace(/^Reviewer B Signed At:\s*.*$/m, `Reviewer B Signed At: ${reviewerSignedAt}`);
    }
    else {
        interpretationText += `\nReviewer B Signed At: ${reviewerSignedAt}`;
    }
    if (/^Reviewer B Independence:\s*/m.test(interpretationText)) {
        interpretationText = interpretationText.replace(/^Reviewer B Independence:\s*.*$/m, `Reviewer B Independence: ${reviewerBIndependence}`);
    }
    else {
        interpretationText += `\nReviewer B Independence: ${reviewerBIndependence}`;
    }
    if (/^Reviewer B COI Disclosure:\s*/m.test(interpretationText)) {
        interpretationText = interpretationText.replace(/^Reviewer B COI Disclosure:\s*.*$/m, `Reviewer B COI Disclosure: ${reviewerBCoiDisclosure}`);
    }
    else {
        interpretationText += `\nReviewer B COI Disclosure: ${reviewerBCoiDisclosure}`;
    }
    if (/^Reviewer Agreement:\s*/m.test(interpretationText)) {
        interpretationText = interpretationText.replace(/^Reviewer Agreement:\s*.*$/m, `Reviewer Agreement: ${reviewerAgreement}`);
    }
    else {
        interpretationText += `\nReviewer Agreement: ${reviewerAgreement}`;
    }
    const tieBreakReviewerValue = reviewerAgreement === 'DISAGREE' ? tieBreakReviewer : 'NOT_REQUIRED';
    const tieBreakDecisionValue = reviewerAgreement === 'DISAGREE' ? tieBreakDecision : 'NOT_REQUIRED';
    const tieBreakSignedAtValue = reviewerAgreement === 'DISAGREE' ? reviewerSignedAt : 'NOT_REQUIRED';
    if (/^Tie-break Reviewer:\s*/m.test(interpretationText)) {
        interpretationText = interpretationText.replace(/^Tie-break Reviewer:\s*.*$/m, `Tie-break Reviewer: ${tieBreakReviewerValue}`);
    }
    else {
        interpretationText += `\nTie-break Reviewer: ${tieBreakReviewerValue}`;
    }
    if (/^Tie-break Decision:\s*/m.test(interpretationText)) {
        interpretationText = interpretationText.replace(/^Tie-break Decision:\s*.*$/m, `Tie-break Decision: ${tieBreakDecisionValue}`);
    }
    else {
        interpretationText += `\nTie-break Decision: ${tieBreakDecisionValue}`;
    }
    if (/^Tie-break Signed At:\s*/m.test(interpretationText)) {
        interpretationText = interpretationText.replace(/^Tie-break Signed At:\s*.*$/m, `Tie-break Signed At: ${tieBreakSignedAtValue}`);
    }
    else {
        interpretationText += `\nTie-break Signed At: ${tieBreakSignedAtValue}`;
    }
    fs_1.default.writeFileSync(interpretationPath, interpretationText);
    console.log(`Finalized ${interpretationPath}`);
}
try {
    main();
}
catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[objective:blind:finalize] ${message}`);
    process.exit(1);
}

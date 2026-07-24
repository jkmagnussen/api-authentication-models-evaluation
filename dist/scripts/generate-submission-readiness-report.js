"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const report_paths_1 = require("./report-paths");
function lineStatus(text, criterion) {
    const match = text.match(new RegExp(`^\\| ${criterion.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\| (PASS|FAIL) \\|`, 'm'));
    return match?.[1] ?? 'UNKNOWN';
}
function main() {
    const root = process.cwd();
    const manifestPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.runManifest);
    const preregPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.preregCompliance);
    const sentinelPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.sentinelControls);
    if (!fs_1.default.existsSync(manifestPath)) {
        throw new Error(`Missing manifest: ${report_paths_1.GENERATED_FILES.runManifest}`);
    }
    if (!fs_1.default.existsSync(preregPath)) {
        throw new Error(`Missing preregistration report: ${report_paths_1.GENERATED_FILES.preregCompliance}`);
    }
    const manifest = JSON.parse(fs_1.default.readFileSync(manifestPath, 'utf8'));
    const preregText = fs_1.default.readFileSync(preregPath, 'utf8');
    const sentinelText = fs_1.default.existsSync(sentinelPath) ? fs_1.default.readFileSync(sentinelPath, 'utf8') : '';
    const governance = manifest.methodology?.governance;
    const technicalChecks = [
        'Full AI matrix coverage for confirmatory claims',
        'Objectivity report explicitly states complete coverage',
        'Dependency lock normalization captured',
        'Frozen analysis window artifact present and fresh',
        'Holdout set definition is sealed and hash-locked',
        'Sentinel controls indicate expected detectability',
        'Signed audit trail is present',
        'Completed arms include provider names',
        'Completed arms include provider model identifiers',
        'Completed arms include prompt fingerprints',
        'Completed arms include generation parameters',
        'Completed arms include retry policy metadata',
        'Protocol deviations unresolved critical count is zero',
    ];
    const technicalValidationStatus = technicalChecks.every((criterion) => lineStatus(preregText, criterion) === 'PASS')
        ? 'PASS'
        : 'FAIL';
    const confirmatoryValidationStatus = governance?.reviewerFinalizationComplete
        ? 'PASS'
        : 'INCOMPLETE';
    const recommendedInterpretationMode = governance?.mode === 'confirmatory' ? 'CONFIRMATORY' : 'EXPLORATORY';
    const sentinelStatus = /^Sentinel Control Status:\s*PASS\s*$/m.test(sentinelText)
        ? 'PASS'
        : 'FAIL';
    const lines = [];
    lines.push('# Submission Readiness Summary');
    lines.push('');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('Regenerate: npm run submission:readiness');
    lines.push('');
    lines.push(`- Git commit: ${manifest.vcs?.gitCommit ?? 'unknown'}`);
    lines.push(`- Git branch: ${manifest.vcs?.gitBranch ?? 'unknown'}`);
    lines.push(`- Working tree dirty at manifest time: ${manifest.vcs?.dirtyWorkingTree ? 'yes' : 'no'}`);
    lines.push(`- Governance mode: ${(governance?.mode ?? 'exploratory').toUpperCase()}`);
    lines.push(`- Claim class: ${governance?.claimClass ?? 'exploratory-author-interpreted'}`);
    lines.push(`- Blind interpretation status: ${governance?.blindInterpretationStatus ?? 'unknown'}`);
    lines.push('');
    lines.push('| Dimension | Status | Notes |');
    lines.push('|---|---|---|');
    lines.push(`| Technical validation | ${technicalValidationStatus} | Derived from preregistered structural, integrity, and artifact checks. |`);
    lines.push(`| Confirmatory reviewer finalization | ${confirmatoryValidationStatus} | Requires finalized blind interpretation with distinct independent reviewers. |`);
    lines.push(`| Recommended interpretation mode | ${recommendedInterpretationMode} | Match dissertation claims to this governance mode. |`);
    lines.push(`| Sentinel controls | ${sentinelStatus} | Based on docs/generated/SENTINEL_CONTROLS.md. |`);
    lines.push('');
    lines.push('## Decision');
    lines.push('');
    if (technicalValidationStatus === 'PASS' && confirmatoryValidationStatus === 'PASS') {
        lines.push('This repository state supports technical and confirmatory claims.');
    }
    else if (technicalValidationStatus === 'PASS') {
        lines.push('This repository state supports technical and reproducibility claims, but confirmatory reviewer finalization remains incomplete. Treat interpretive claims as exploratory.');
    }
    else {
        lines.push('This repository state is not ready for high-confidence submission claims until the failing technical validation dimensions are resolved.');
    }
    const outputPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.submissionReadiness);
    fs_1.default.writeFileSync(outputPath, `${lines.join('\n')}\n`);
    console.log(`Wrote ${outputPath}`);
}
main();

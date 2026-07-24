"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const report_paths_1 = require("./report-paths");
function main() {
    const root = process.cwd();
    const interpretationPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.aiBlindInterpretation);
    if (!fs_1.default.existsSync(interpretationPath)) {
        throw new Error(`Missing blind interpretation artifact: ${report_paths_1.GENERATED_FILES.aiBlindInterpretation}`);
    }
    const text = fs_1.default.readFileSync(interpretationPath, 'utf8');
    const hasAgreement = /^Reviewer Agreement:\s*AGREE\s*$/m.test(text);
    if (!hasAgreement) {
        console.log('[objective:blind:disagreement] Current interpretation is not in AGREE mode; no simulation needed.');
        return;
    }
    const simulated = text
        .replace(/^Reviewer Agreement:\s*AGREE\s*$/m, 'Reviewer Agreement: DISAGREE')
        .replace(/^Tie-break Reviewer:\s*.*$/m, 'Tie-break Reviewer: PENDING')
        .replace(/^Tie-break Decision:\s*.*$/m, 'Tie-break Decision: PENDING')
        .replace(/^Tie-break Signed At:\s*.*$/m, 'Tie-break Signed At: PENDING');
    const backupPath = `${interpretationPath}.bak`;
    fs_1.default.copyFileSync(interpretationPath, backupPath);
    fs_1.default.writeFileSync(interpretationPath, simulated);
    console.log(`[objective:blind:disagreement] Simulated disagreement by writing a backup to ${path_1.default.relative(root, backupPath)} and marking agreement DISAGREE.`);
    console.log('Run npm run objective:preregistered:check to verify tie-break enforcement, then restore the backup manually if needed.');
}
try {
    main();
}
catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[objective:blind:disagreement] ${message}`);
    process.exit(1);
}

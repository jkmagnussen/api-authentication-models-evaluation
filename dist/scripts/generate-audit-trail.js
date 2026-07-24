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
function readText(filePath) {
    if (!fs_1.default.existsSync(filePath)) {
        throw new Error(`Missing audit-trail input: ${path_1.default.relative(process.cwd(), filePath)}`);
    }
    return fs_1.default.readFileSync(filePath, 'utf8');
}
function main() {
    const root = process.cwd();
    const outputPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.auditTrail);
    const shouldRefresh = process.argv.includes('--refresh');
    const now = new Date().toISOString();
    const entries = [
        {
            label: 'protocol-seal',
            path: report_paths_1.GENERATED_FILES.protocolSeal,
            sha256: sha256(readText(path_1.default.join(root, report_paths_1.GENERATED_FILES.protocolSeal))),
        },
        {
            label: 'power-analysis-seal',
            path: report_paths_1.GENERATED_FILES.powerAnalysisSeal,
            sha256: sha256(readText(path_1.default.join(root, report_paths_1.GENERATED_FILES.powerAnalysisSeal))),
        },
        {
            label: 'blind-interpretation',
            path: report_paths_1.GENERATED_FILES.aiBlindInterpretation,
            sha256: sha256(readText(path_1.default.join(root, report_paths_1.GENERATED_FILES.aiBlindInterpretation))),
        },
        {
            label: 'analysis-window',
            path: report_paths_1.GENERATED_FILES.analysisWindow,
            sha256: sha256(readText(path_1.default.join(root, report_paths_1.GENERATED_FILES.analysisWindow))),
        },
        {
            label: 'holdout-seal',
            path: report_paths_1.GENERATED_FILES.holdoutSeal,
            sha256: sha256(readText(path_1.default.join(root, report_paths_1.GENERATED_FILES.holdoutSeal))),
        },
        {
            label: 'preregistered-compliance',
            path: report_paths_1.GENERATED_FILES.preregCompliance,
            sha256: sha256(readText(path_1.default.join(root, report_paths_1.GENERATED_FILES.preregCompliance))),
        },
    ];
    const signatureSource = entries
        .map((entry) => `${entry.label}:${entry.path}:${entry.sha256}`)
        .join('\n');
    const payload = {
        generatedAt: now,
        signedAt: now,
        signatureSha256: sha256(signatureSource),
        entries,
    };
    if (fs_1.default.existsSync(outputPath) && !shouldRefresh) {
        const existing = JSON.parse(fs_1.default.readFileSync(outputPath, 'utf8'));
        if (existing.signatureSha256 === payload.signatureSha256) {
            fs_1.default.writeFileSync(outputPath, JSON.stringify({ ...existing, generatedAt: now }, null, 2));
            console.log(`Preserved audit trail: ${outputPath}`);
            return;
        }
    }
    fs_1.default.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
    console.log(`${shouldRefresh ? 'Refreshed' : 'Signed'} audit trail: ${outputPath}`);
}
try {
    main();
}
catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[objective:audit:trail] ${message}`);
    process.exit(1);
}

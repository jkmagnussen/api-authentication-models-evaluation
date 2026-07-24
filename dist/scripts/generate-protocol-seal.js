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
function main() {
    const root = process.cwd();
    const protocolPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.runManifest);
    const outputPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.protocolSeal);
    const shouldRefresh = process.argv.includes('--refresh');
    if (!fs_1.default.existsSync(protocolPath)) {
        throw new Error(`Missing protocol source artifact: ${report_paths_1.GENERATED_FILES.runManifest}`);
    }
    const protocolText = fs_1.default.readFileSync(protocolPath, 'utf8');
    const protocolDocumentSha256 = sha256(protocolText);
    const now = new Date().toISOString();
    if (fs_1.default.existsSync(outputPath) && !shouldRefresh) {
        const existing = JSON.parse(fs_1.default.readFileSync(outputPath, 'utf8'));
        if (existing.protocolDocumentSha256 === protocolDocumentSha256) {
            console.log(`Preserved protocol seal: ${outputPath}`);
            return;
        }
    }
    const payload = {
        generatedAt: now,
        lockedAt: now,
        protocolDocumentPath: report_paths_1.GENERATED_FILES.runManifest,
        protocolDocumentSha256,
    };
    fs_1.default.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
    console.log(`${shouldRefresh ? 'Refreshed' : 'Locked'} protocol seal: ${outputPath}`);
}
main();

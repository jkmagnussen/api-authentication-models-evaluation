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
    return (0, crypto_1.createHash)("sha256").update(text).digest("hex");
}
function main() {
    const root = process.cwd();
    const outputPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.holdoutSeal);
    const holdoutDefinitionPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.analysisWindow);
    const shouldRefresh = process.argv.includes("--refresh");
    const now = new Date().toISOString();
    if (!fs_1.default.existsSync(holdoutDefinitionPath)) {
        throw new Error(`Missing holdout source artifact: ${report_paths_1.GENERATED_FILES.analysisWindow}`);
    }
    const holdoutText = fs_1.default.readFileSync(holdoutDefinitionPath, "utf8");
    const holdoutHash = sha256(holdoutText);
    if (fs_1.default.existsSync(outputPath) && !shouldRefresh) {
        const existing = JSON.parse(fs_1.default.readFileSync(outputPath, "utf8"));
        const preserved = {
            ...existing,
            generatedAt: now,
            holdoutDefinitionPath: report_paths_1.GENERATED_FILES.analysisWindow,
            holdoutDefinitionSha256: holdoutHash,
        };
        fs_1.default.writeFileSync(outputPath, JSON.stringify(preserved, null, 2));
        console.log(`Preserved holdout seal: ${outputPath}`);
        return;
    }
    const payload = {
        generatedAt: now,
        sealedAt: now,
        holdoutDefinitionPath: report_paths_1.GENERATED_FILES.analysisWindow,
        holdoutDefinitionSha256: holdoutHash,
    };
    fs_1.default.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
    console.log(`${shouldRefresh ? "Refreshed" : "Sealed"} holdout definition: ${outputPath}`);
}
try {
    main();
}
catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[objective:holdout:seal] ${message}`);
    process.exit(1);
}

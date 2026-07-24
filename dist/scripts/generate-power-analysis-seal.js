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
    const rationalePath = path_1.default.join(root, report_paths_1.GENERATED_FILES.sensitivityAnalysis);
    const outputPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.powerAnalysisSeal);
    const shouldRefresh = process.argv.includes("--refresh");
    const now = new Date().toISOString();
    if (!fs_1.default.existsSync(rationalePath)) {
        throw new Error(`Missing sensitivity analysis source: ${report_paths_1.GENERATED_FILES.sensitivityAnalysis}`);
    }
    const rationaleText = fs_1.default.readFileSync(rationalePath, "utf8");
    const rationaleSha256 = sha256(rationaleText);
    if (fs_1.default.existsSync(outputPath) && !shouldRefresh) {
        const existing = JSON.parse(fs_1.default.readFileSync(outputPath, "utf8"));
        const preserved = {
            ...existing,
            generatedAt: now,
            rationalePath: report_paths_1.GENERATED_FILES.sensitivityAnalysis,
            rationaleSha256,
        };
        fs_1.default.writeFileSync(outputPath, JSON.stringify(preserved, null, 2));
        console.log(`Preserved power analysis seal: ${outputPath}`);
        return;
    }
    const payload = {
        generatedAt: now,
        sealedAt: now,
        rationalePath: report_paths_1.GENERATED_FILES.sensitivityAnalysis,
        rationaleSha256,
    };
    fs_1.default.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
    console.log(`${shouldRefresh ? "Refreshed" : "Sealed"} power analysis rationale: ${outputPath}`);
}
try {
    main();
}
catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[objective:power:seal] ${message}`);
    process.exit(1);
}

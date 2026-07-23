"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const report_paths_1 = require("./report-paths");
function getLatestHistoryGeneratedAt(historyDir) {
    if (!fs_1.default.existsSync(historyDir))
        return { latest: null, count: 0 };
    const files = fs_1.default
        .readdirSync(historyDir)
        .filter((file) => file.endsWith(".json"))
        .sort();
    let latest = null;
    let count = 0;
    for (const fileName of files) {
        const filePath = path_1.default.join(historyDir, fileName);
        try {
            const snapshot = JSON.parse(fs_1.default.readFileSync(filePath, "utf8"));
            if (snapshot.generatedAt && (!latest || snapshot.generatedAt > latest)) {
                latest = snapshot.generatedAt;
            }
            count += 1;
        }
        catch {
            // Ignore malformed snapshots.
        }
    }
    return { latest, count };
}
function main() {
    const root = process.cwd();
    const outputPath = path_1.default.join(root, report_paths_1.GENERATED_FILES.analysisWindow);
    const historyDir = path_1.default.join(root, "ai-generated", "arms", "history");
    const shouldRefresh = process.argv.includes("--refresh");
    const now = new Date().toISOString();
    if (fs_1.default.existsSync(outputPath) && !shouldRefresh) {
        const existing = JSON.parse(fs_1.default.readFileSync(outputPath, "utf8"));
        const preserved = {
            ...existing,
            generatedAt: now,
        };
        fs_1.default.writeFileSync(outputPath, JSON.stringify(preserved, null, 2));
        console.log(`Preserved frozen analysis window: ${outputPath}`);
        return;
    }
    const historySummary = getLatestHistoryGeneratedAt(historyDir);
    const payload = {
        generatedAt: now,
        lockedAt: now,
        frozenHistoryMaxGeneratedAt: historySummary.latest,
        historySnapshotsAtLock: historySummary.count,
    };
    fs_1.default.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
    console.log(`${shouldRefresh ? "Refreshed" : "Locked"} analysis window: ${outputPath}`);
}
main();

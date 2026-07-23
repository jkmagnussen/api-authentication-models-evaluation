"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateStats = calculateStats;
exports.writePerformanceResult = writePerformanceResult;
const fs_1 = __importDefault(require("fs"));
function calculateStats(times) {
    times.sort((a, b) => a - b);
    const total = times.reduce((a, b) => a + b, 0);
    const avg = total / times.length;
    const p95 = times[Math.floor(times.length * 0.95)];
    const p99 = times[Math.floor(times.length * 0.99)];
    const throughput = 1000 / avg; // requests per second
    return { avg, p95, p99, throughput };
}
function writePerformanceResult(kind, model, stats) {
    const outputDir = `docs/performance-results/${kind}`;
    if (!fs_1.default.existsSync(outputDir)) {
        fs_1.default.mkdirSync(outputDir, { recursive: true });
    }
    fs_1.default.writeFileSync(`${outputDir}/${model}.json`, JSON.stringify(stats, null, 2));
    const runId = process.env.PERF_RUN_ID;
    if (!runId) {
        return;
    }
    const runDir = `docs/performance-results/runs/${runId}/${kind}`;
    if (!fs_1.default.existsSync(runDir)) {
        fs_1.default.mkdirSync(runDir, { recursive: true });
    }
    fs_1.default.writeFileSync(`${runDir}/${model}.json`, JSON.stringify(stats, null, 2));
    const metadataPath = `docs/performance-results/runs/${runId}/metadata.json`;
    if (!fs_1.default.existsSync(metadataPath)) {
        const metadata = {
            runId,
            timestamp: new Date().toISOString(),
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            hostname: process.env.COMPUTERNAME || "unknown",
            warmup: "none",
            notes: "Generated from Jest performance tests"
        };
        fs_1.default.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    }
}

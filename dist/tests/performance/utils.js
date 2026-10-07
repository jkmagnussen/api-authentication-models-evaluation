"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPerformanceHttpClient = createPerformanceHttpClient;
exports.calculateStats = calculateStats;
exports.writePerformanceResult = writePerformanceResult;
const fs_1 = __importDefault(require("fs"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
async function createPerformanceHttpClient(app, maxSockets = 1) {
    // Reuse one listener/keep-alive pool; creating a Supertest server per request exhausted Windows ephemeral ports.
    const server = app.listen(0, '127.0.0.1');
    await new Promise((resolve, reject) => {
        server.once('listening', resolve);
        server.once('error', reject);
    });
    const address = server.address();
    if (!address || typeof address === 'string') {
        await new Promise((resolve) => server.close(() => resolve()));
        throw new Error('Performance server did not bind a TCP port');
    }
    const agent = new http_1.default.Agent({ keepAlive: true, maxSockets });
    return {
        get(pathname, headers) {
            return new Promise((resolve, reject) => {
                const request = http_1.default.get({
                    hostname: '127.0.0.1',
                    port: address.port,
                    path: pathname,
                    headers,
                    agent,
                }, (response) => {
                    response.resume();
                    response.once('end', () => resolve(response.statusCode ?? 0));
                });
                request.once('error', reject);
            });
        },
        close() {
            agent.destroy();
            return new Promise((resolve, reject) => {
                server.close((error) => error ? reject(error) : resolve());
            });
        },
    };
}
function calculateStats(times) {
    times.sort((a, b) => a - b);
    const total = times.reduce((a, b) => a + b, 0);
    const avg = total / times.length;
    const p95 = times[Math.floor(times.length * 0.95)];
    const p99 = times[Math.floor(times.length * 0.99)];
    const throughput = 1000 / avg; // requests per second
    return { avg, p95, p99, throughput };
}
function writePerformanceResult(kind, model, stats, rawTimes, outputRoot = 'docs/performance-results') {
    const outputDir = path_1.default.join(outputRoot, kind);
    if (!fs_1.default.existsSync(outputDir)) {
        fs_1.default.mkdirSync(outputDir, { recursive: true });
    }
    fs_1.default.writeFileSync(path_1.default.join(outputDir, `${model}.json`), JSON.stringify(stats, null, 2));
    if (rawTimes) {
        const rawDir = path_1.default.join(outputDir, 'raw');
        if (!fs_1.default.existsSync(rawDir)) {
            fs_1.default.mkdirSync(rawDir, { recursive: true });
        }
        fs_1.default.writeFileSync(path_1.default.join(rawDir, `${model}.json`), JSON.stringify(rawTimes, null, 2));
    }
    const runId = process.env.PERF_RUN_ID;
    if (!runId) {
        return;
    }
    const runDir = path_1.default.join(outputRoot, 'runs', runId, kind);
    if (!fs_1.default.existsSync(runDir)) {
        fs_1.default.mkdirSync(runDir, { recursive: true });
    }
    fs_1.default.writeFileSync(path_1.default.join(runDir, `${model}.json`), JSON.stringify(stats, null, 2));
    if (rawTimes) {
        const runRawDir = path_1.default.join(outputRoot, 'runs', runId, kind, 'raw');
        if (!fs_1.default.existsSync(runRawDir)) {
            fs_1.default.mkdirSync(runRawDir, { recursive: true });
        }
        fs_1.default.writeFileSync(path_1.default.join(runRawDir, `${model}.json`), JSON.stringify(rawTimes, null, 2));
    }
    const metadataPath = path_1.default.join(outputRoot, 'runs', runId, 'metadata.json');
    if (!fs_1.default.existsSync(metadataPath)) {
        const metadata = {
            runId,
            protocolVersion: 0,
            matchedBlockVerified: false,
            timestamp: new Date().toISOString(),
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            hostname: process.env.COMPUTERNAME || 'unknown',
            warmup: 'none',
            notes: 'Legacy run metadata; condition order and per-condition timing were not recorded.',
        };
        fs_1.default.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    }
}

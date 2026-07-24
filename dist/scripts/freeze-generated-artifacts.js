"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
const ROOT = process.cwd();
const LOCK_PATH = path_1.default.join(ROOT, 'docs', 'generated', 'OFFLINE_FREEZE_LOCK.json');
const PROTECTED_ROOTS = [
    'docs/generated',
    'docs/charts',
    'docs/performance-results',
    'ai-generated/results',
    'ai-generated/arms',
];
function normalizePath(filePath) {
    return filePath.split(path_1.default.sep).join('/');
}
function listFilesRecursively(baseDir) {
    if (!fs_1.default.existsSync(baseDir)) {
        return [];
    }
    const entries = fs_1.default.readdirSync(baseDir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const absolutePath = path_1.default.join(baseDir, entry.name);
        if (entry.isDirectory()) {
            files.push(...listFilesRecursively(absolutePath));
            continue;
        }
        if (entry.isFile()) {
            files.push(absolutePath);
        }
    }
    return files;
}
function hashFile(filePath) {
    const hash = (0, crypto_1.createHash)('sha256');
    hash.update(fs_1.default.readFileSync(filePath));
    return hash.digest('hex');
}
function ensureParentDirectory(filePath) {
    const parent = path_1.default.dirname(filePath);
    if (!fs_1.default.existsSync(parent)) {
        fs_1.default.mkdirSync(parent, { recursive: true });
    }
}
function main() {
    const allFiles = PROTECTED_ROOTS.flatMap((relativeRoot) => listFilesRecursively(path_1.default.join(ROOT, relativeRoot)));
    const filtered = allFiles
        .map((absolutePath) => ({
        absolutePath,
        relativePath: normalizePath(path_1.default.relative(ROOT, absolutePath)),
        bytes: fs_1.default.statSync(absolutePath).size,
    }))
        .filter((item) => item.relativePath !== 'docs/generated/OFFLINE_FREEZE_LOCK.json')
        .sort((a, b) => a.relativePath.localeCompare(b.relativePath));
    const files = filtered.map((item) => ({
        path: item.relativePath,
        sha256: hashFile(item.absolutePath),
        bytes: item.bytes,
    }));
    const lock = {
        generatedAt: new Date().toISOString(),
        mode: 'offline-freeze',
        notes: 'Live provider generation is blocked while this lock file exists. Remove it intentionally or set ALLOW_LIVE_AI_GENERATION=true to override.',
        lockVersion: 1,
        blockLiveProviderGeneration: true,
        allowOverrideEnvVar: 'ALLOW_LIVE_AI_GENERATION',
        protectedRoots: PROTECTED_ROOTS,
        fileCount: files.length,
        totalBytes: files.reduce((sum, entry) => sum + entry.bytes, 0),
        files,
    };
    ensureParentDirectory(LOCK_PATH);
    fs_1.default.writeFileSync(LOCK_PATH, `${JSON.stringify(lock, null, 2)}\n`, 'utf8');
    console.log(`Offline freeze lock written: ${normalizePath(path_1.default.relative(ROOT, LOCK_PATH))}`);
    console.log(`Protected files: ${lock.fileCount}`);
    console.log(`Total bytes fingerprinted: ${lock.totalBytes}`);
}
main();

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
function normalizePath(filePath) {
    return filePath.split(path_1.default.sep).join('/');
}
function hashFile(filePath) {
    const hash = (0, crypto_1.createHash)('sha256');
    hash.update(fs_1.default.readFileSync(filePath));
    return hash.digest('hex');
}
function main() {
    if (!fs_1.default.existsSync(LOCK_PATH)) {
        throw new Error('Offline freeze lock is missing. Run: npm run freeze:offline');
    }
    const lock = JSON.parse(fs_1.default.readFileSync(LOCK_PATH, 'utf8'));
    const expectedByPath = new Map(lock.files.map((entry) => [entry.path, entry]));
    const actualPaths = new Set();
    const errors = [];
    for (const expected of lock.files) {
        const absolute = path_1.default.join(ROOT, expected.path);
        actualPaths.add(expected.path);
        if (!fs_1.default.existsSync(absolute)) {
            errors.push(`Missing file: ${expected.path}`);
            continue;
        }
        const actualBytes = fs_1.default.statSync(absolute).size;
        const actualSha = hashFile(absolute);
        if (actualBytes !== expected.bytes) {
            errors.push(`Size mismatch: ${expected.path} expected=${expected.bytes} actual=${actualBytes}`);
        }
        if (actualSha !== expected.sha256) {
            errors.push(`Hash mismatch: ${expected.path}`);
        }
    }
    for (const root of lock.protectedRoots) {
        const absoluteRoot = path_1.default.join(ROOT, root);
        if (!fs_1.default.existsSync(absoluteRoot)) {
            continue;
        }
        const stack = [absoluteRoot];
        while (stack.length > 0) {
            const current = stack.pop();
            const entries = fs_1.default.readdirSync(current, { withFileTypes: true });
            for (const entry of entries) {
                const absolutePath = path_1.default.join(current, entry.name);
                if (entry.isDirectory()) {
                    stack.push(absolutePath);
                    continue;
                }
                if (!entry.isFile()) {
                    continue;
                }
                const relative = normalizePath(path_1.default.relative(ROOT, absolutePath));
                if (relative === 'docs/generated/OFFLINE_FREEZE_LOCK.json') {
                    continue;
                }
                if (!expectedByPath.has(relative)) {
                    errors.push(`Untracked file in protected roots: ${relative}`);
                }
            }
        }
    }
    if (errors.length > 0) {
        console.error('Offline freeze verification failed:');
        for (const error of errors) {
            console.error(`- ${error}`);
        }
        process.exit(1);
    }
    console.log(`Offline freeze verification passed for ${lock.files.length} files.`);
}
main();

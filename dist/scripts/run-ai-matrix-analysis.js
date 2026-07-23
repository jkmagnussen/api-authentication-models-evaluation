"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const node_child_process_1 = require("node:child_process");
dotenv_1.default.config({ override: true });
function getArgValue(name) {
    const index = process.argv.indexOf(name);
    if (index === -1)
        return null;
    return process.argv[index + 1] ?? null;
}
const ARMS = [
    { key: "openai-neutral", provider: "openai", promptMode: "neutral" },
    { key: "openai-security-guided", provider: "openai", promptMode: "security-guided" },
    { key: "claude-neutral", provider: "claude", promptMode: "neutral" },
    { key: "claude-security-guided", provider: "claude", promptMode: "security-guided" },
];
function parseTargetArmKey() {
    const fromFlag = getArgValue("--arm");
    const fromEnv = process.env.AI_ARM?.trim() ?? "";
    const value = (fromFlag ?? fromEnv).trim();
    return value.length > 0 ? value : null;
}
function parseAllowPartial() {
    const fromFlag = getArgValue("--allow-partial");
    if (fromFlag) {
        return ["1", "true", "yes"].includes(fromFlag.toLowerCase());
    }
    const fromEnv = (process.env.AI_ALLOW_PARTIAL_MATRIX ?? "").trim().toLowerCase();
    return ["1", "true", "yes"].includes(fromEnv);
}
function run(command, envOverrides = {}) {
    const result = (0, node_child_process_1.spawnSync)(command, {
        stdio: "inherit",
        shell: true,
        env: {
            ...process.env,
            ...envOverrides,
        },
    });
    return (result.status ?? 1) === 0;
}
function parseCsvLine(line) {
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i += 1;
            }
            else {
                inQuotes = !inQuotes;
            }
            continue;
        }
        if (char === "," && !inQuotes) {
            values.push(current);
            current = "";
            continue;
        }
        current += char;
    }
    values.push(current);
    return values;
}
function loadOverallFailure(root) {
    const csvPath = path_1.default.join(root, "ai-generated", "results", "ai-samples-failure-rates.csv");
    if (!fs_1.default.existsSync(csvPath))
        return null;
    const lines = fs_1.default
        .readFileSync(csvPath, "utf8")
        .trim()
        .split(/\r?\n/)
        .map(parseCsvLine);
    if (lines.length <= 1)
        return null;
    const overall = lines.slice(1).find((row) => row[0]?.toUpperCase() === "OVERALL");
    if (!overall)
        return null;
    return {
        totalSamples: Number(overall[1]),
        failedSamples: Number(overall[3]),
        failureRatePct: Number(overall[4]),
    };
}
function ensureDir(dirPath) {
    if (!fs_1.default.existsSync(dirPath)) {
        fs_1.default.mkdirSync(dirPath, { recursive: true });
    }
}
function copyDirectory(sourceDir, targetDir) {
    ensureDir(targetDir);
    const entries = fs_1.default.readdirSync(sourceDir, { withFileTypes: true });
    for (const entry of entries) {
        const sourcePath = path_1.default.join(sourceDir, entry.name);
        const targetPath = path_1.default.join(targetDir, entry.name);
        if (entry.isDirectory()) {
            copyDirectory(sourcePath, targetPath);
            continue;
        }
        fs_1.default.copyFileSync(sourcePath, targetPath);
    }
}
function clearDirectory(dirPath) {
    if (!fs_1.default.existsSync(dirPath))
        return;
    const entries = fs_1.default.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        const target = path_1.default.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            fs_1.default.rmSync(target, { recursive: true, force: true });
        }
        else {
            fs_1.default.unlinkSync(target);
        }
    }
}
function providerReady(provider) {
    if (provider === "openai") {
        if (!process.env.OPENAI_API_KEY) {
            return { ready: false, reason: "Missing OPENAI_API_KEY." };
        }
        return { ready: true };
    }
    if (!process.env.ANTHROPIC_API_KEY) {
        return { ready: false, reason: "Missing ANTHROPIC_API_KEY." };
    }
    return { ready: true };
}
function getGenerationCommand(arm) {
    if (arm.provider === "openai") {
        return `npm run ai:generate:openai -- --prompt-mode ${arm.promptMode}`;
    }
    return `npm run ai:generate:claude -- --prompt-mode ${arm.promptMode}`;
}
function runArm(arm) {
    console.log(`[ai-matrix] Starting ${arm.key.toUpperCase()} arm...`);
    const steps = [
        getGenerationCommand(arm),
        "npm run ai:test:oauth",
        "npm run ai:test:jwt",
        "npm run ai:test:sessions",
        "npm run ai:analyse",
        "npm run ai:report",
    ];
    for (const step of steps) {
        const ok = run(step);
        if (!ok) {
            console.error(`[ai-matrix] ${arm.key.toUpperCase()} step failed: ${step}`);
            return false;
        }
    }
    return true;
}
function snapshotArm(arm) {
    const root = process.cwd();
    const armDir = path_1.default.join(root, "ai-generated", "arms", arm.key);
    const sampleTarget = path_1.default.join(armDir, "samples");
    const resultsTarget = path_1.default.join(armDir, "results");
    ensureDir(armDir);
    clearDirectory(sampleTarget);
    clearDirectory(resultsTarget);
    ensureDir(sampleTarget);
    ensureDir(resultsTarget);
    for (const model of ["oauth", "jwt", "sessions"]) {
        copyDirectory(path_1.default.join(root, "ai-generated", model), path_1.default.join(sampleTarget, model));
    }
    copyDirectory(path_1.default.join(root, "ai-generated", "results"), resultsTarget);
    const generationMetadataPath = path_1.default.join(root, "ai-generated", "results", "generation-metadata.json");
    const generationMetadata = fs_1.default.existsSync(generationMetadataPath)
        ? JSON.parse(fs_1.default.readFileSync(generationMetadataPath, "utf8"))
        : null;
    const overallFailure = loadOverallFailure(root);
    const metadata = {
        provider: arm.provider,
        promptMode: arm.promptMode,
        sampleCount: process.env.AI_SAMPLE_COUNT ? Number(process.env.AI_SAMPLE_COUNT) : undefined,
        generatedAt: new Date().toISOString(),
        providerModelIdentifier: generationMetadata?.providerModelIdentifier,
        providerEndpoint: generationMetadata?.providerEndpoint,
        generationParameters: generationMetadata?.generationParameters,
        promptFingerprints: generationMetadata?.promptFingerprints,
        retryPolicy: generationMetadata?.retryPolicy,
        retrySummary: generationMetadata?.retrySummary,
        overallFailure: overallFailure ?? undefined,
    };
    fs_1.default.writeFileSync(path_1.default.join(armDir, "metadata.json"), JSON.stringify(metadata, null, 2));
    return metadata;
}
function main() {
    const runSummary = [];
    const targetArmKey = parseTargetArmKey();
    const allowPartial = parseAllowPartial();
    const armsToRun = targetArmKey ? ARMS.filter((arm) => arm.key === targetArmKey) : ARMS;
    if (targetArmKey && armsToRun.length === 0) {
        console.error(`[ai-matrix] Unknown arm: ${targetArmKey}. Use one of: ${ARMS.map((arm) => arm.key).join(", ")}`);
        process.exit(1);
    }
    for (const arm of armsToRun) {
        const readiness = providerReady(arm.provider);
        if (!readiness.ready) {
            const reason = readiness.reason ?? "Provider credentials unavailable.";
            if (allowPartial) {
                console.warn(`[ai-matrix] Skipping ${arm.key.toUpperCase()}: ${reason}`);
                runSummary.push({ ...arm, status: "skipped", reason });
            }
            else {
                console.error(`[ai-matrix] ${arm.key.toUpperCase()} is required but unavailable: ${reason}`);
                runSummary.push({ ...arm, status: "failed", reason });
            }
            continue;
        }
        const ok = runArm(arm);
        if (!ok) {
            runSummary.push({ ...arm, status: "failed", reason: "One or more pipeline steps failed." });
            continue;
        }
        const snapshotMetadata = snapshotArm(arm);
        runSummary.push({
            ...arm,
            status: "completed",
            providerModelIdentifier: snapshotMetadata.providerModelIdentifier,
            promptFingerprint: snapshotMetadata.promptFingerprints?.systemPromptSha256,
            overallFailureRatePct: snapshotMetadata.overallFailure?.failureRatePct,
            overallFailedSamples: snapshotMetadata.overallFailure?.failedSamples,
            overallTotalSamples: snapshotMetadata.overallFailure?.totalSamples,
        });
    }
    const summaryPayload = {
        generatedAt: new Date().toISOString(),
        sampleCount: Number(process.env.AI_SAMPLE_COUNT ?? "30"),
        allowPartial,
        requiredArms: armsToRun.map((arm) => arm.key),
        providers: runSummary,
    };
    fs_1.default.writeFileSync(path_1.default.join(process.cwd(), "ai-generated", "arms", "run-summary.json"), JSON.stringify(summaryPayload, null, 2));
    const historyDir = path_1.default.join(process.cwd(), "ai-generated", "arms", "history");
    ensureDir(historyDir);
    const historyFileName = `${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    fs_1.default.writeFileSync(path_1.default.join(historyDir, historyFileName), JSON.stringify(summaryPayload, null, 2));
    const completedCount = runSummary.filter((entry) => entry.status === "completed").length;
    const requiredCount = armsToRun.length;
    if (allowPartial) {
        if (completedCount === 0) {
            console.error("[ai-matrix] No AI provider arm completed. Configure provider credentials and try again.");
            process.exit(1);
        }
        console.log("[ai-matrix] Completed available provider-condition arms and archived outputs.");
        return;
    }
    if (completedCount !== requiredCount) {
        console.error(`[ai-matrix] Incomplete provider matrix coverage (${completedCount}/${requiredCount}). Re-run after configuring all required providers or pass --allow-partial true.`);
        process.exit(1);
    }
    console.log("[ai-matrix] Completed full provider-condition matrix and archived outputs.");
}
main();

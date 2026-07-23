"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_child_process_1 = require("node:child_process");
function getArgValue(flag) {
    const index = process.argv.indexOf(flag);
    if (index === -1)
        return null;
    return process.argv[index + 1] ?? null;
}
function parsePositiveInt(value, fallback, label) {
    if (!value)
        return fallback;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
        throw new Error(`Invalid ${label}: ${value}. Expected a positive integer.`);
    }
    return parsed;
}
function parseOptions() {
    const cohorts = parsePositiveInt(getArgValue("--cohorts"), Number(process.env.AI_COHORT_COUNT ?? "3"), "cohort count");
    const sampleCount = parsePositiveInt(getArgValue("--sample-count"), Number(process.env.AI_COHORT_SAMPLE_COUNT ?? "5"), "sample count");
    const requestTimeoutMs = parsePositiveInt(getArgValue("--request-timeout-ms"), Number(process.env.AI_COHORT_REQUEST_TIMEOUT_MS ?? "120000"), "request timeout");
    const sampleTimeoutMs = parsePositiveInt(getArgValue("--sample-timeout-ms"), Number(process.env.AI_COHORT_SAMPLE_TIMEOUT_MS ?? "180000"), "sample timeout");
    const verifyFlag = getArgValue("--verify") ?? process.env.AI_COHORT_VERIFY;
    const verify = verifyFlag ? ["1", "true", "yes", "on"].includes(verifyFlag.toLowerCase()) : true;
    return {
        cohorts,
        sampleCount,
        requestTimeoutMs,
        sampleTimeoutMs,
        verify,
    };
}
function runNpmScript(script, env) {
    const command = `npm run ${script}`;
    const result = (0, node_child_process_1.spawnSync)(command, {
        stdio: "inherit",
        env,
        shell: true,
    });
    if (result.error) {
        throw new Error(`Failed to launch npm for script '${script}': ${result.error.message}`);
    }
    if ((result.status ?? 1) !== 0) {
        throw new Error(`Command failed with exit code ${result.status ?? "unknown"}: npm run ${script}`);
    }
}
function main() {
    const options = parseOptions();
    const env = {
        ...process.env,
        AI_SAMPLE_COUNT: String(options.sampleCount),
        AI_PROVIDER_REQUEST_TIMEOUT_MS: String(options.requestTimeoutMs),
        AI_PROVIDER_SAMPLE_TIMEOUT_MS: String(options.sampleTimeoutMs),
    };
    console.log(`[ai:matrix:cohorts] Starting ${options.cohorts} cohort(s) with sampleCount=${options.sampleCount}, requestTimeoutMs=${options.requestTimeoutMs}, sampleTimeoutMs=${options.sampleTimeoutMs}.`);
    for (let i = 1; i <= options.cohorts; i += 1) {
        console.log(`[ai:matrix:cohorts] Running cohort ${i}/${options.cohorts}...`);
        runNpmScript("ai:matrix", env);
    }
    if (options.verify) {
        console.log("[ai:matrix:cohorts] Regenerating manifest and prereg compliance artifacts...");
        runNpmScript("env:manifest", env);
        runNpmScript("objective:preregistered:report", env);
        runNpmScript("objective:preregistered:check", env);
    }
    console.log("[ai:matrix:cohorts] Completed successfully.");
}
try {
    main();
}
catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[ai:matrix:cohorts] ${message}`);
    process.exit(1);
}

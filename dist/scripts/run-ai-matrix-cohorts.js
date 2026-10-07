"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseOptions = parseOptions;
exports.buildStudyPlan = buildStudyPlan;
exports.validateCohortArm = validateCohortArm;
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const node_child_process_1 = require("node:child_process");
const provider_model_identifiers_1 = require("../ai-generated/provider-model-identifiers");
const generator_prompts_1 = require("../ai-generated/generator-prompts");
const generation_settings_1 = require("../ai-generated/generation-settings");
dotenv_1.default.config();
const DEFAULT_COHORTS = 30;
const DEFAULT_SAMPLES_PER_COHORT = 1;
const AI_ANALYSIS_METHOD_VERSION = 2;
const MODELS = ['oauth', 'jwt', 'sessions'];
const ARMS = [
    { key: 'openai-neutral', provider: 'openai', promptMode: 'neutral' },
    { key: 'openai-security-guided', provider: 'openai', promptMode: 'security-guided' },
    { key: 'claude-neutral', provider: 'claude', promptMode: 'neutral' },
    { key: 'claude-security-guided', provider: 'claude', promptMode: 'security-guided' },
];
const RUNS_ROOT = path_1.default.join(process.cwd(), 'ai-generated', 'cohorts');
const STUDY_SOURCE_FILES = [
    'package.json',
    'package-lock.json',
    'ai-generated/common.ts',
    'ai-generated/generator-prompts.ts',
    'ai-generated/generation-settings.ts',
    'ai-generated/provider-model-identifiers.ts',
    'ai-generated/generate-provider-samples.ts',
    'ai-generated/checks.ts',
    'ai-generated/checks-secondary.ts',
    'ai-generated/validate-controls.ts',
    'scripts/run-ai-matrix-cohorts.ts',
    'scripts/generate-ai-provider-blinded-report.ts',
];
let activeStudyManifestPath = null;
function argValue(flag) {
    const index = process.argv.indexOf(flag);
    return index < 0 ? undefined : process.argv[index + 1];
}
function positiveInteger(value, fallback, label) {
    if (value === undefined)
        return fallback;
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < 1) {
        throw new Error(`${label} must be a positive integer.`);
    }
    return parsed;
}
function parseOptions(args = process.argv.slice(2)) {
    const readArg = (name) => {
        const index = args.indexOf(name);
        return index < 0 ? undefined : args[index + 1];
    };
    const cohortCount = positiveInteger(readArg('--cohorts'), DEFAULT_COHORTS, 'Cohort count');
    const samplesPerCohort = positiveInteger(readArg('--sample-count'), DEFAULT_SAMPLES_PER_COHORT, 'Samples per cohort');
    const studyId = readArg('--study-id') ?? `study-${new Date().toISOString().replace(/[-:.]/g, '')}`;
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(studyId)) {
        throw new Error('Study ID may contain only letters, numbers, underscores, and hyphens.');
    }
    return {
        cohortCount,
        samplesPerCohort,
        studyId,
        planOnly: args.includes('--plan'),
        aggregateExisting: args.includes('--aggregate-existing'),
    };
}
function buildStudyPlan(options) {
    const armPlans = Array.from({ length: options.cohortCount }, (_, cohortIndex) => {
        const offset = cohortIndex % ARMS.length;
        const order = [...ARMS.slice(offset), ...ARMS.slice(0, offset)].map((arm) => arm.key);
        return { cohort: cohortIndex + 1, armOrder: order };
    });
    return {
        cohortCount: options.cohortCount,
        samplesPerMechanismPerCohort: options.samplesPerCohort,
        samplesPerMechanismPerArm: options.cohortCount * options.samplesPerCohort,
        samplesPerArm: options.cohortCount * options.samplesPerCohort * MODELS.length,
        totalSamples: options.cohortCount * options.samplesPerCohort * MODELS.length * ARMS.length,
        promptProtocolVersion: generator_prompts_1.GENERATION_PROMPT_PROTOCOL_VERSION,
        analysisMethodVersion: AI_ANALYSIS_METHOD_VERSION,
        maximumProviderRequests: options.cohortCount * options.samplesPerCohort * MODELS.length * ARMS.length * provider_model_identifiers_1.AI_PROVIDER_MAX_ATTEMPTS,
        requestedModelIdentifiers: provider_model_identifiers_1.AI_PROVIDER_MODEL_IDENTIFIERS,
        orderByCohort: armPlans,
    };
}
function saveJson(filePath, value) {
    fs_1.default.mkdirSync(path_1.default.dirname(filePath), { recursive: true });
    fs_1.default.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
function runTsScript(scriptPath, args, env) {
    const tsNodeCli = path_1.default.join(process.cwd(), 'node_modules', 'ts-node', 'dist', 'bin.js');
    const result = (0, node_child_process_1.spawnSync)(process.execPath, [tsNodeCli, scriptPath, ...args], {
        cwd: process.cwd(),
        env,
        stdio: 'inherit',
    });
    if (result.error)
        throw result.error;
    if (result.status !== 0) {
        throw new Error(`Command failed (${result.status ?? 'unknown'}): ${scriptPath} ${args.join(' ')}`);
    }
}
function armOutputRoot(cohortRoot, armKey) {
    return path_1.default.join(cohortRoot, 'arms', armKey);
}
function validateCohortArm(dataRoot, sampleCount, arm) {
    const generationPath = path_1.default.join(dataRoot, 'results', 'generation-metadata.json');
    const generation = JSON.parse(fs_1.default.readFileSync(generationPath, 'utf8'));
    if (generation.provider !== arm.provider || generation.promptMode !== arm.promptMode) {
        throw new Error(`Generation metadata mismatch for ${arm.key}.`);
    }
    if (generation.promptProtocolVersion !== generator_prompts_1.GENERATION_PROMPT_PROTOCOL_VERSION) {
        throw new Error(`${arm.key} uses prompt protocol ${generation.promptProtocolVersion}; expected ${generator_prompts_1.GENERATION_PROMPT_PROTOCOL_VERSION}.`);
    }
    const requestedModelIdentifier = provider_model_identifiers_1.AI_PROVIDER_MODEL_IDENTIFIERS[arm.provider];
    if (generation.providerModelIdentifier !== requestedModelIdentifier) {
        throw new Error(`${arm.key} requested '${generation.providerModelIdentifier}', expected pinned identifier '${requestedModelIdentifier}'.`);
    }
    if (generation.sampleCount !== sampleCount) {
        throw new Error(`${arm.key} reports ${generation.sampleCount} samples; expected ${sampleCount}.`);
    }
    if (generation.generationParameters?.temperature !== generation_settings_1.GENERATION_SETTINGS.temperature ||
        generation.generationParameters?.maxTokens !== generation_settings_1.GENERATION_SETTINGS.maxTokens) {
        throw new Error(`${arm.key} generation settings do not match the prespecified temperature/token limit.`);
    }
    if (generation.sampleGenerations?.length !== sampleCount * MODELS.length) {
        throw new Error(`${arm.key} does not contain per-sample timestamps for every generated output.`);
    }
    const sampleGenerations = generation.sampleGenerations ?? [];
    const generationKeys = new Set(sampleGenerations.map((record) => `${record.model}:sample${record.sample}`));
    const expectedGenerationKeys = MODELS.flatMap((model) => Array.from({ length: sampleCount }, (_, index) => `${model}:sample${index + 1}`));
    if (generationKeys.size !== expectedGenerationKeys.length ||
        expectedGenerationKeys.some((key) => !generationKeys.has(key))) {
        throw new Error(`${arm.key} generation timestamp records do not match the expected sample IDs.`);
    }
    if (sampleGenerations.some((record) => {
        const startedAt = Date.parse(record.startedAt);
        const completedAt = Date.parse(record.completedAt);
        return !Number.isFinite(startedAt) || !Number.isFinite(completedAt) || completedAt < startedAt;
    })) {
        throw new Error(`${arm.key} contains invalid per-sample generation timestamps.`);
    }
    if (sampleGenerations.some((record) => record.requestedModelIdentifier !== requestedModelIdentifier ||
        !record.returnedModelIdentifier ||
        !Number.isInteger(record.providerAttempts) ||
        record.providerAttempts < 1 ||
        record.providerAttempts > provider_model_identifiers_1.AI_PROVIDER_MAX_ATTEMPTS)) {
        throw new Error(`${arm.key} has incomplete model/attempt provenance for one or more outputs.`);
    }
    const returnedModels = new Set(sampleGenerations.map((record) => record.returnedModelIdentifier));
    if (returnedModels.size !== 1) {
        throw new Error(`${arm.key} returned multiple model identifiers within one cohort; split versions into separate studies.`);
    }
    const returnedModelIdentifier = sampleGenerations[0]?.returnedModelIdentifier;
    if (!returnedModelIdentifier)
        throw new Error(`${arm.key} has no provider-returned model identifier.`);
    if (returnedModelIdentifier !== requestedModelIdentifier) {
        throw new Error(`${arm.key} returned '${returnedModelIdentifier}' instead of the pinned model '${requestedModelIdentifier}'.`);
    }
    const systemFingerprintsByModel = Object.fromEntries(MODELS.map((model) => [
        model,
        [...new Set(sampleGenerations
                .filter((record) => record.model === model)
                .map((record) => record.systemFingerprint)
                .filter((fingerprint) => Boolean(fingerprint)))],
    ]));
    const sampleResults = [];
    const sampleHashes = {};
    const resultsByModel = {};
    for (const model of MODELS) {
        const samplesDir = path_1.default.join(dataRoot, model);
        const sampleNames = fs_1.default.readdirSync(samplesDir).filter((name) => /^sample\d+\.ts$/.test(name)).sort();
        if (sampleNames.length !== sampleCount) {
            throw new Error(`${arm.key}/${model} has ${sampleNames.length} sample files; expected exactly ${sampleCount}.`);
        }
        sampleHashes[model] = [];
        for (let sample = 1; sample <= sampleCount; sample += 1) {
            const samplePath = path_1.default.join(samplesDir, `sample${sample}.ts`);
            const testPath = path_1.default.join(dataRoot, 'results', `${model}-sample${sample}-tests.json`);
            if (!fs_1.default.existsSync(samplePath) || !fs_1.default.existsSync(testPath)) {
                throw new Error(`Missing source or test result for ${arm.key}/${model}/sample${sample}.`);
            }
            const source = fs_1.default.readFileSync(samplePath);
            sampleHashes[model].push(crypto_1.default.createHash('sha256').update(source).digest('hex'));
            const sampleResult = JSON.parse(fs_1.default.readFileSync(testPath, 'utf8'));
            if (sampleResult.model !== model || sampleResult.sample !== `sample${sample}` || typeof sampleResult.passed !== 'boolean') {
                throw new Error(`Mismatched test-result identity at ${arm.key}/${model}/sample${sample}.`);
            }
            sampleResults.push(sampleResult);
        }
        const modelResults = sampleResults.filter((result) => result.model === model);
        const failedSamples = modelResults.filter((result) => !result.passed).length;
        resultsByModel[model] = {
            totalSamples: modelResults.length,
            failedSamples,
            failureRatePct: (failedSamples / modelResults.length) * 100,
        };
    }
    const expectedResults = sampleCount * MODELS.length;
    if (sampleResults.length !== expectedResults) {
        throw new Error(`${arm.key} has ${sampleResults.length} test results; expected ${expectedResults}.`);
    }
    const checkerAgreementPath = path_1.default.join(dataRoot, 'results', 'checker-agreement-summary.json');
    if (!fs_1.default.existsSync(checkerAgreementPath)) {
        throw new Error(`${arm.key} is missing positive/negative-control and secondary-checker agreement results.`);
    }
    const checkerAgreement = JSON.parse(fs_1.default.readFileSync(checkerAgreementPath, 'utf8'));
    if (checkerAgreement.generatedSampleAgreement?.observations !== expectedResults) {
        throw new Error(`${arm.key} secondary-checker agreement does not cover all ${expectedResults} outputs.`);
    }
    const calibrationControls = MODELS.flatMap((model) => [
        { model, label: `positive-control-${model}`, expected: true },
        { model, label: `negative-control-${model}`, expected: false },
    ]).map((control) => {
        const resultPath = path_1.default.join(dataRoot, 'results', `${control.label}.json`);
        if (!fs_1.default.existsSync(resultPath))
            throw new Error(`${arm.key} is missing calibration control ${control.label}.`);
        const result = JSON.parse(fs_1.default.readFileSync(resultPath, 'utf8'));
        if (result.matchedExpectationPrimary !== true || result.matchedExpectationSecondary !== true) {
            throw new Error(`${arm.key} failed primary/secondary calibration control ${control.label}.`);
        }
        return { ...control, primaryPassed: result.matchedExpectationPrimary, secondaryPassed: result.matchedExpectationSecondary };
    });
    return {
        generation,
        sampleGenerations,
        returnedModelIdentifier,
        systemFingerprintsByModel,
        sampleResults,
        sampleHashes,
        resultsByModel,
        checkerAgreement,
        calibrationControls,
    };
}
function failureRateCsv(sampleResults) {
    const rows = ['label,totalSamples,passedSamples,failedSamples,failureRatePct'];
    let overallTotal = 0;
    let overallPassed = 0;
    for (const model of MODELS) {
        const results = sampleResults.filter((result) => result.model === model);
        const passed = results.filter((result) => result.passed).length;
        const failed = results.length - passed;
        overallTotal += results.length;
        overallPassed += passed;
        rows.push(`${model.toUpperCase()},${results.length},${passed},${failed},${((failed / results.length) * 100).toFixed(1)}`);
    }
    const overallFailed = overallTotal - overallPassed;
    rows.push(`OVERALL,${overallTotal},${overallPassed},${overallFailed},${((overallFailed / overallTotal) * 100).toFixed(1)}`);
    return rows.join('\n');
}
function copyFile(source, destination) {
    fs_1.default.mkdirSync(path_1.default.dirname(destination), { recursive: true });
    fs_1.default.copyFileSync(source, destination);
}
function archiveLegacyReports(studyRoot) {
    const reportPaths = [
        path_1.default.join(process.cwd(), 'docs', 'generated', 'AI_PROVIDER_PROMPT_COMPARISON_BLINDED.md'),
        path_1.default.join(process.cwd(), 'docs', 'generated', 'AI_PROVIDER_PROMPT_COMPARISON.md'),
    ];
    const archived = [];
    for (const reportPath of reportPaths) {
        if (!fs_1.default.existsSync(reportPath))
            continue;
        const archivedPath = path_1.default.join(studyRoot, 'legacy-reports', path_1.default.basename(reportPath));
        copyFile(reportPath, archivedPath);
        archived.push(path_1.default.relative(studyRoot, archivedPath));
    }
    return archived;
}
function aggregateStudy(studyRoot, options) {
    const aggregateRoot = path_1.default.join(studyRoot, 'aggregate', 'arms');
    const armSummaries = [];
    const expectedPerMechanism = options.cohortCount * options.samplesPerCohort;
    for (const arm of ARMS) {
        const allTests = [];
        const cohortRecords = [];
        const hashesByModel = Object.fromEntries(MODELS.map((model) => [model, []]));
        for (let cohortIndex = 1; cohortIndex <= options.cohortCount; cohortIndex += 1) {
            const cohortRoot = path_1.default.join(studyRoot, `cohort-${String(cohortIndex).padStart(2, '0')}`);
            const dataRoot = armOutputRoot(cohortRoot, arm.key);
            const validated = validateCohortArm(dataRoot, options.samplesPerCohort, arm);
            cohortRecords.push({
                cohort: cohortIndex,
                generatedAt: validated.generation.generatedAt,
                startedAt: validated.generation.startedAt,
                providerEndpoint: validated.generation.providerEndpoint,
                providerApiVersion: validated.generation.providerApiVersion,
                promptProtocolVersion: validated.generation.promptProtocolVersion,
                requestedModelIdentifier: validated.generation.providerModelIdentifier,
                returnedModelIdentifier: validated.returnedModelIdentifier,
                systemFingerprints: [...new Set(validated.sampleGenerations.map((record) => record.systemFingerprint).filter((value) => Boolean(value)))],
                systemFingerprintsByMechanism: validated.systemFingerprintsByModel,
                generationParameters: validated.generation.generationParameters ?? {},
                retrySummary: validated.generation.retrySummary,
                promptFingerprints: validated.generation.promptFingerprints,
                sampleGenerations: validated.sampleGenerations,
                resultsByMechanism: validated.resultsByModel,
                contentHashesByMechanism: validated.sampleHashes,
                checkerAgreement: validated.checkerAgreement,
                calibrationControls: validated.calibrationControls,
            });
            validated.sampleResults.forEach((result) => {
                const localIndex = Number(result.sample.replace('sample', ''));
                const globalIndex = (cohortIndex - 1) * options.samplesPerCohort + localIndex;
                const aggregateSample = `sample${globalIndex}`;
                const sourceSample = path_1.default.join(dataRoot, result.model, `${result.sample}.ts`);
                const targetSample = path_1.default.join(aggregateRoot, arm.key, 'samples', result.model, `${aggregateSample}.ts`);
                copyFile(sourceSample, targetSample);
                const complexitySource = path_1.default.join(dataRoot, 'results', `${result.model}-${result.sample}.json`);
                const testSource = path_1.default.join(dataRoot, 'results', `${result.model}-${result.sample}-tests.json`);
                const complexity = JSON.parse(fs_1.default.readFileSync(complexitySource, 'utf8'));
                const tests = JSON.parse(fs_1.default.readFileSync(testSource, 'utf8'));
                const aggregateResult = { ...complexity, sample: aggregateSample, cohort: cohortIndex };
                const aggregateTest = { ...tests, sample: aggregateSample, cohort: cohortIndex };
                saveJson(path_1.default.join(aggregateRoot, arm.key, 'results', `${result.model}-${aggregateSample}.json`), aggregateResult);
                saveJson(path_1.default.join(aggregateRoot, arm.key, 'results', `${result.model}-${aggregateSample}-tests.json`), aggregateTest);
                allTests.push(aggregateTest);
            });
            for (const model of MODELS)
                hashesByModel[model].push(...validated.sampleHashes[model]);
        }
        const providerModels = new Set(cohortRecords.map((record) => record.returnedModelIdentifier));
        if (providerModels.size !== 1) {
            throw new Error(`${arm.key} changed provider model across cohorts; split model versions into separate studies.`);
        }
        for (const model of MODELS) {
            const count = allTests.filter((result) => result.model === model).length;
            if (count !== expectedPerMechanism) {
                throw new Error(`${arm.key}/${model} aggregate has ${count} outputs; expected ${expectedPerMechanism}.`);
            }
        }
        const failuresCsv = failureRateCsv(allTests);
        const resultsDir = path_1.default.join(aggregateRoot, arm.key, 'results');
        fs_1.default.mkdirSync(resultsDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(resultsDir, 'ai-samples-failure-rates.csv'), `${failuresCsv}\n`);
        saveJson(path_1.default.join(resultsDir, 'cohort-provenance.json'), {
            protocolVersion: 1,
            promptProtocolVersion: generator_prompts_1.GENERATION_PROMPT_PROTOCOL_VERSION,
            analysisMethodVersion: AI_ANALYSIS_METHOD_VERSION,
            studyId: options.studyId,
            cohortCount: options.cohortCount,
            samplesPerMechanism: expectedPerMechanism,
            samplesPerMechanismPerCohort: options.samplesPerCohort,
            sampleUnit: 'One provider completion request; identical content remains a separate generation event and is hash-reported.',
            cohorts: cohortRecords,
            exactDuplicateContentByModel: Object.fromEntries(MODELS.map((model) => [model, hashesByModel[model].length - new Set(hashesByModel[model]).size])),
        });
        saveJson(path_1.default.join(aggregateRoot, arm.key, 'metadata.json'), {
            protocolVersion: 1,
            promptProtocolVersion: generator_prompts_1.GENERATION_PROMPT_PROTOCOL_VERSION,
            analysisMethodVersion: AI_ANALYSIS_METHOD_VERSION,
            studyId: options.studyId,
            provider: arm.provider,
            promptMode: arm.promptMode,
            cohortCount: options.cohortCount,
            samplesPerMechanism: expectedPerMechanism,
            samplesPerMechanismPerCohort: options.samplesPerCohort,
            totalSamples: allTests.length,
            sampleUnit: 'One successful provider generation request; exact content duplicates are retained and reported by hash count.',
            generationCohorts: cohortRecords,
        });
        const overall = allTests.length;
        armSummaries.push({
            key: arm.key,
            provider: arm.provider,
            promptMode: arm.promptMode,
            samplesPerMechanism: expectedPerMechanism,
            totalSamples: overall,
            failedSamples: allTests.filter((result) => !result.passed).length,
            requestedModelIdentifier: provider_model_identifiers_1.AI_PROVIDER_MODEL_IDENTIFIERS[arm.provider],
            returnedModelIdentifier: Array.from(providerModels)[0],
            systemFingerprints: [...new Set(cohortRecords.flatMap((record) => record.systemFingerprints))],
            systemFingerprintsByMechanism: Object.fromEntries(MODELS.map((model) => [
                model,
                [...new Set(cohortRecords.flatMap((record) => record.systemFingerprintsByMechanism[model] ?? []))],
            ])),
            generationParameters: generation_settings_1.GENERATION_SETTINGS,
        });
    }
    const inferenceSuppressionReasons = [];
    for (const provider of ['openai', 'claude']) {
        const providerArms = armSummaries.filter((summary) => summary.provider === provider);
        const returnedModelIds = new Set(providerArms.map((summary) => summary.returnedModelIdentifier));
        if (providerArms.length !== 2 || returnedModelIds.size !== 1) {
            throw new Error(`${provider} returned inconsistent model identifiers across neutral and security-guided arms; study aggregation was stopped.`);
        }
        if (provider === 'openai') {
            const neutral = providerArms.find((summary) => summary.promptMode === 'neutral');
            const guided = providerArms.find((summary) => summary.promptMode === 'security-guided');
            for (const model of MODELS) {
                const neutralFingerprints = neutral?.systemFingerprintsByMechanism[model] ?? [];
                const guidedFingerprints = guided?.systemFingerprintsByMechanism[model] ?? [];
                if (neutralFingerprints.length > 1 || guidedFingerprints.length > 1 ||
                    neutralFingerprints.join('|') !== guidedFingerprints.join('|')) {
                    inferenceSuppressionReasons.push(`OpenAI system_fingerprint differs between neutral and security-guided ${model} outputs.`);
                }
            }
        }
    }
    const inferenceEligible = inferenceSuppressionReasons.length === 0;
    for (const armSummary of armSummaries) {
        armSummary.inferenceEligible = inferenceEligible;
        armSummary.inferenceSuppressionReasons = inferenceSuppressionReasons;
        const armMetadataPath = path_1.default.join(aggregateRoot, armSummary.key, 'metadata.json');
        const armMetadata = JSON.parse(fs_1.default.readFileSync(armMetadataPath, 'utf8'));
        saveJson(armMetadataPath, { ...armMetadata, inferenceEligible, inferenceSuppressionReasons });
    }
    return { aggregateRoot, inferenceEligible, inferenceSuppressionReasons, armSummaries };
}
function runCohort(arm, cohortRoot, sampleCount) {
    const dataRoot = armOutputRoot(cohortRoot, arm.key);
    fs_1.default.mkdirSync(dataRoot, { recursive: true });
    const env = {
        ...process.env,
        AI_DATA_ROOT: dataRoot,
        AI_SAMPLE_COUNT: String(sampleCount),
        OPENAI_MODEL: provider_model_identifiers_1.AI_PROVIDER_MODEL_IDENTIFIERS.openai,
        ANTHROPIC_MODEL: provider_model_identifiers_1.AI_PROVIDER_MODEL_IDENTIFIERS.claude,
    };
    runTsScript('ai-generated/generate-provider-samples.ts', [
        '--provider', arm.provider,
        '--prompt-mode', arm.promptMode,
    ], env);
    for (const model of MODELS) {
        runTsScript(`ai-generated/${model}/run-sample-tests.ts`, [], env);
    }
    runTsScript('ai-generated/analyse-samples.ts', [], env);
    runTsScript('ai-generated/validate-controls.ts', [], env);
}
function requireProviders() {
    if (!process.env.OPENAI_API_KEY)
        throw new Error('Missing OPENAI_API_KEY; no cohort data has been created.');
    if (!process.env.ANTHROPIC_API_KEY)
        throw new Error('Missing ANTHROPIC_API_KEY; no cohort data has been created.');
    const freezeLock = path_1.default.join(process.cwd(), 'docs', 'generated', 'OFFLINE_FREEZE_LOCK.json');
    if (fs_1.default.existsSync(freezeLock) && (process.env.ALLOW_LIVE_AI_GENERATION ?? '').toLowerCase() !== 'true') {
        throw new Error('The offline freeze lock is active. Explicitly set ALLOW_LIVE_AI_GENERATION=true to run live generation.');
    }
}
function printPlan(options) {
    const plan = buildStudyPlan(options);
    console.log(JSON.stringify({ ...plan, studyId: options.studyId, plannedOutputs: plan.totalSamples }, null, 2));
}
function buildStudySourceProvenance() {
    const sourceSha256 = Object.fromEntries(STUDY_SOURCE_FILES.map((relativePath) => {
        const filePath = path_1.default.join(process.cwd(), relativePath);
        if (!fs_1.default.existsSync(filePath))
            throw new Error(`Missing study source file: ${relativePath}`);
        return [relativePath, crypto_1.default.createHash('sha256').update(fs_1.default.readFileSync(filePath)).digest('hex')];
    }));
    const gitCommit = (0, node_child_process_1.spawnSync)('git', ['rev-parse', 'HEAD'], { cwd: process.cwd(), encoding: 'utf8' });
    const gitStatus = (0, node_child_process_1.spawnSync)('git', ['status', '--porcelain'], { cwd: process.cwd(), encoding: 'utf8' });
    return {
        gitCommit: gitCommit.status === 0 ? gitCommit.stdout.trim() : null,
        workingTreeDirty: gitStatus.status === 0 ? gitStatus.stdout.trim().length > 0 : null,
        sourceSha256,
    };
}
function buildRecoveryAnalysisProvenance() {
    const recoveryFiles = [
        'scripts/run-ai-matrix-cohorts.ts',
        'scripts/generate-ai-provider-blinded-report.ts',
    ];
    const sourceSha256 = Object.fromEntries(recoveryFiles.map((relativePath) => {
        const filePath = path_1.default.join(process.cwd(), relativePath);
        return [relativePath, crypto_1.default.createHash('sha256').update(fs_1.default.readFileSync(filePath)).digest('hex')];
    }));
    const gitCommit = (0, node_child_process_1.spawnSync)('git', ['rev-parse', 'HEAD'], { cwd: process.cwd(), encoding: 'utf8' });
    return {
        analyzedAt: new Date().toISOString(),
        gitCommit: gitCommit.status === 0 ? gitCommit.stdout.trim() : null,
        sourceSha256,
    };
}
function writeStudyComparisonReport(studyRoot, studyId, aggregateRoot) {
    const reportCli = path_1.default.join(process.cwd(), 'node_modules', 'ts-node', 'dist', 'bin.js');
    const reportResult = (0, node_child_process_1.spawnSync)(process.execPath, [reportCli, 'scripts/generate-ai-provider-blinded-report.ts'], {
        cwd: process.cwd(),
        env: {
            ...process.env,
            AI_PROVIDER_ARMS_ROOT: aggregateRoot,
            AI_PROVIDER_STUDY_ID: studyId,
        },
        stdio: 'inherit',
    });
    if (reportResult.status !== 0) {
        throw new Error(`Study artifacts were saved, but provider comparison report generation failed (${reportResult.status}).`);
    }
    const studyReportPath = path_1.default.join(studyRoot, 'reports', 'AI_PROVIDER_PROMPT_COMPARISON_BLINDED.md');
    copyFile(path_1.default.join(process.cwd(), 'docs', 'generated', 'AI_PROVIDER_PROMPT_COMPARISON_BLINDED.md'), studyReportPath);
    return path_1.default.relative(process.cwd(), studyReportPath);
}
function finishStudyManifest(studyRoot, studyId, baseManifest, aggregation, studyBlindedReport) {
    saveJson(path_1.default.join(studyRoot, 'study-manifest.json'), {
        ...baseManifest,
        studyId,
        completedAt: new Date().toISOString(),
        status: aggregation.inferenceEligible ? 'completed' : 'completed_descriptive_only',
        inferenceEligible: aggregation.inferenceEligible,
        inferenceSuppressionReasons: aggregation.inferenceSuppressionReasons,
        aggregateRoot: path_1.default.relative(process.cwd(), aggregation.aggregateRoot),
        studyBlindedReport,
        arms: aggregation.armSummaries,
    });
}
function main() {
    const options = parseOptions();
    if (options.planOnly) {
        printPlan(options);
        return;
    }
    if (options.aggregateExisting) {
        const studyRoot = path_1.default.join(RUNS_ROOT, options.studyId);
        const manifestPath = path_1.default.join(studyRoot, 'study-manifest.json');
        if (!fs_1.default.existsSync(manifestPath))
            throw new Error(`No saved study manifest found for '${options.studyId}'.`);
        if (fs_1.default.existsSync(path_1.default.join(studyRoot, 'aggregate'))) {
            throw new Error(`Study '${options.studyId}' already has aggregate outputs; refusing to overwrite them.`);
        }
        const existingManifest = JSON.parse(fs_1.default.readFileSync(manifestPath, 'utf8'));
        if (existingManifest.status !== 'failed' || existingManifest.partialArtifactsPreserved !== true) {
            throw new Error('Only a failed study explicitly marked with preserved partial artifacts can use --aggregate-existing.');
        }
        if (existingManifest.cohortCount !== options.cohortCount ||
            existingManifest.samplesPerMechanismPerCohort !== options.samplesPerCohort ||
            existingManifest.promptProtocolVersion !== generator_prompts_1.GENERATION_PROMPT_PROTOCOL_VERSION) {
            throw new Error('Saved study plan does not match the current cohort/prompt protocol options.');
        }
        for (let cohort = 1; cohort <= options.cohortCount; cohort += 1) {
            const cohortManifest = path_1.default.join(studyRoot, `cohort-${String(cohort).padStart(2, '0')}`, 'cohort-manifest.json');
            if (!fs_1.default.existsSync(cohortManifest))
                throw new Error(`Missing completed cohort ${cohort}; recovery aggregation stopped.`);
        }
        activeStudyManifestPath = manifestPath;
        const aggregation = aggregateStudy(studyRoot, options);
        const studyBlindedReport = writeStudyComparisonReport(studyRoot, options.studyId, aggregation.aggregateRoot);
        finishStudyManifest(studyRoot, options.studyId, {
            ...existingManifest,
            recoveredFromPreviousFailure: true,
            recoveryAggregationAt: new Date().toISOString(),
            recoveryAnalysisProvenance: buildRecoveryAnalysisProvenance(),
        }, aggregation, studyBlindedReport);
        activeStudyManifestPath = null;
        console.log(`Aggregated preserved study '${options.studyId}' without provider calls (${aggregation.inferenceEligible ? 'inferentially eligible' : 'descriptive-only'}).`);
        return;
    }
    requireProviders();
    const studyRoot = path_1.default.join(RUNS_ROOT, options.studyId);
    if (fs_1.default.existsSync(studyRoot)) {
        throw new Error(`Study ID '${options.studyId}' already exists; choose a new ID to preserve existing cohort artifacts.`);
    }
    fs_1.default.mkdirSync(studyRoot, { recursive: true });
    const archivedLegacyReports = archiveLegacyReports(studyRoot);
    activeStudyManifestPath = path_1.default.join(studyRoot, 'study-manifest.json');
    const plan = buildStudyPlan(options);
    const sourceProvenance = buildStudySourceProvenance();
    saveJson(activeStudyManifestPath, {
        protocolVersion: 1,
        studyId: options.studyId,
        startedAt: new Date().toISOString(),
        ...plan,
        sourceProvenance,
        status: 'running',
        runtime: {
            nodeVersion: process.version,
            platform: process.platform,
            platformRelease: os_1.default.release(),
            arch: process.arch,
        },
        host: {
            hostname: os_1.default.hostname(),
            cpuModel: os_1.default.cpus()[0]?.model ?? 'unknown',
            cpuCores: os_1.default.cpus().length,
            totalMemoryBytes: os_1.default.totalmem(),
        },
    });
    for (const cohortPlan of plan.orderByCohort) {
        const cohortId = `cohort-${String(cohortPlan.cohort).padStart(2, '0')}`;
        const cohortRoot = path_1.default.join(studyRoot, cohortId);
        fs_1.default.mkdirSync(cohortRoot, { recursive: true });
        const cohortStartedAt = new Date().toISOString();
        const order = cohortPlan.armOrder;
        for (const armKey of order) {
            const arm = ARMS.find((entry) => entry.key === armKey);
            if (!arm)
                throw new Error(`Unknown arm in plan: ${armKey}`);
            runCohort(arm, cohortRoot, options.samplesPerCohort);
        }
        saveJson(path_1.default.join(cohortRoot, 'cohort-manifest.json'), {
            protocolVersion: 1,
            analysisMethodVersion: AI_ANALYSIS_METHOD_VERSION,
            promptProtocolVersion: generator_prompts_1.GENERATION_PROMPT_PROTOCOL_VERSION,
            cohort: cohortPlan.cohort,
            startedAt: cohortStartedAt,
            completedAt: new Date().toISOString(),
            armOrder: order,
            samplesPerMechanismPerArm: options.samplesPerCohort,
        });
    }
    const aggregation = aggregateStudy(studyRoot, options);
    const studyBlindedReport = writeStudyComparisonReport(studyRoot, options.studyId, aggregation.aggregateRoot);
    const initialManifest = JSON.parse(fs_1.default.readFileSync(activeStudyManifestPath, 'utf8'));
    finishStudyManifest(studyRoot, options.studyId, {
        ...initialManifest,
        archivedLegacyReports,
    }, aggregation, studyBlindedReport);
    activeStudyManifestPath = null;
    console.log(`Completed isolated AI cohort study '${options.studyId}' (${aggregation.inferenceEligible ? 'inferentially eligible' : 'descriptive-only'}).`);
}
if (require.main === module) {
    try {
        main();
    }
    catch (error) {
        if (activeStudyManifestPath && fs_1.default.existsSync(activeStudyManifestPath)) {
            try {
                const manifest = JSON.parse(fs_1.default.readFileSync(activeStudyManifestPath, 'utf8'));
                saveJson(activeStudyManifestPath, {
                    ...manifest,
                    status: 'failed',
                    failedAt: new Date().toISOString(),
                    partialArtifactsPreserved: true,
                });
            }
            catch {
                // Keep the original failure as the primary error if status recording also fails.
            }
        }
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    }
}

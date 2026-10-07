"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.armDenominatorMatches = armDenominatorMatches;
exports.extractCohortRates = extractCohortRates;
exports.holmBonferroni = holmBonferroni;
exports.deriveBootstrapSeed = deriveBootstrapSeed;
exports.wilson95 = wilson95;
exports.pairedCohortDifferences = pairedCohortDifferences;
exports.pairedCohortTTest = pairedCohortTTest;
exports.bootstrapDelta95 = bootstrapDelta95;
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const report_paths_1 = require("./report-paths");
const { jStat } = require('jstat');
const ARM_KEYS = [
    'openai-neutral',
    'openai-security-guided',
    'claude-neutral',
    'claude-security-guided',
];
const DEFAULT_STUDY_ID = 'ai-clean-2026-10-05';
function getStudyId() {
    const argIndex = process.argv.indexOf('--study-id');
    return argIndex >= 0 ? process.argv[argIndex + 1] : process.env.AI_PROVIDER_STUDY_ID ?? DEFAULT_STUDY_ID;
}
const PROVIDER_STUDY_ID = getStudyId();
const ARMS_ROOT = path_1.default.resolve(process.env.AI_PROVIDER_ARMS_ROOT ?? (PROVIDER_STUDY_ID
    ? path_1.default.join(process.cwd(), 'ai-generated', 'cohorts', PROVIDER_STUDY_ID, 'aggregate', 'arms')
    : path_1.default.join(process.cwd(), 'ai-generated', 'arms')));
const BOOTSTRAP_ITERATIONS = 2000;
const BOOTSTRAP_CONFIDENCE_LEVEL = 0.95;
const MIN_PRACTICAL_EFFECT_PCT = Number(process.env.AI_MIN_PRACTICAL_EFFECT_PCT ?? '3');
function armDenominatorMatches(metadata, rows) {
    const expectedPerMechanism = metadata?.samplesPerMechanism;
    const modelRows = ['OAUTH', 'JWT', 'SESSIONS'].map((label) => rowByLabel(rows, label));
    const overall = rowByLabel(rows, 'OVERALL');
    const cohortRecords = metadata?.generationCohorts ?? [];
    const expectedCohortSize = metadata?.samplesPerMechanismPerCohort;
    const validCohorts = typeof metadata?.cohortCount === 'number' &&
        typeof expectedCohortSize === 'number' &&
        metadata.cohortCount === 30 &&
        expectedCohortSize === 1 &&
        metadata?.cohortCount === cohortRecords.length &&
        metadata.cohortCount * expectedCohortSize === expectedPerMechanism &&
        new Set(cohortRecords.map((record) => record.cohort)).size === cohortRecords.length &&
        Array.from({ length: metadata?.cohortCount ?? 0 }, (_, index) => index + 1)
            .every((cohortId) => cohortRecords.some((record) => record.cohort === cohortId)) &&
        cohortRecords.every((record) => ['oauth', 'jwt', 'sessions'].every((model) => {
            const outcome = record.resultsByMechanism?.[model];
            return outcome?.totalSamples === expectedCohortSize &&
                Number.isInteger(outcome.failedSamples) &&
                outcome.failedSamples >= 0 && outcome.failedSamples <= expectedCohortSize;
        })) &&
        ['oauth', 'jwt', 'sessions'].every((model) => {
            const row = rowByLabel(rows, model);
            const outcomes = cohortRecords.map((record) => record.resultsByMechanism?.[model]);
            const total = outcomes.reduce((sum, outcome) => sum + (outcome?.totalSamples ?? 0), 0);
            const failed = outcomes.reduce((sum, outcome) => sum + (outcome?.failedSamples ?? 0), 0);
            return total === row?.totalSamples && failed === row?.failedSamples;
        });
    return metadata?.protocolVersion === 1 &&
        metadata.promptProtocolVersion === 2 &&
        metadata.analysisMethodVersion === 2 &&
        typeof expectedPerMechanism === 'number' &&
        Number.isInteger(expectedPerMechanism) &&
        modelRows.every((row) => row?.totalSamples === expectedPerMechanism) &&
        overall?.totalSamples === metadata.totalSamples &&
        overall?.totalSamples === expectedPerMechanism * 3 && validCohorts;
}
function extractCohortRates(metadata) {
    if (!metadata?.generationCohorts || !metadata.samplesPerMechanismPerCohort)
        return [];
    return metadata.generationCohorts.map((record) => {
        const outcomes = Object.values(record.resultsByMechanism ?? {});
        const total = outcomes.reduce((sum, outcome) => sum + (outcome.totalSamples ?? 0), 0);
        const failed = outcomes.reduce((sum, outcome) => sum + (outcome.failedSamples ?? 0), 0);
        return { cohort: record.cohort, failed, total, failureRatePct: total > 0 ? (failed / total) * 100 : Number.NaN };
    });
}
function parseCsvLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        if (char === '"') {
            if (inQuotes && line[index + 1] === '"') {
                current += '"';
                index += 1;
            }
            else {
                inQuotes = !inQuotes;
            }
            continue;
        }
        if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
            continue;
        }
        current += char;
    }
    values.push(current);
    return values;
}
function parseFailureRateCsv(csvText) {
    const rows = csvText.trim().split(/\r?\n/).map(parseCsvLine);
    if (rows.length <= 1)
        return [];
    return rows.slice(1).map((row) => ({
        label: row[0],
        totalSamples: Number(row[1]),
        passedSamples: Number(row[2]),
        failedSamples: Number(row[3]),
        failureRatePct: Number(row[4]),
    }));
}
function rowByLabel(rows, label) {
    return rows.find((row) => row.label.toUpperCase() === label.toUpperCase());
}
function loadArmData(armKey) {
    const csvPath = path_1.default.join(ARMS_ROOT, armKey, 'results', 'ai-samples-failure-rates.csv');
    if (!fs_1.default.existsSync(csvPath))
        return null;
    const csvText = fs_1.default.readFileSync(csvPath, 'utf8');
    const rows = parseFailureRateCsv(csvText);
    const metadataPath = path_1.default.join(ARMS_ROOT, armKey, 'metadata.json');
    const metadata = fs_1.default.existsSync(metadataPath)
        ? JSON.parse(fs_1.default.readFileSync(metadataPath, 'utf8'))
        : null;
    const protocolVerified = armDenominatorMatches(metadata, rows);
    const cohortRates = extractCohortRates(metadata);
    return {
        key: armKey,
        rows,
        protocolVerified,
        cohortRates,
        inferenceEligible: metadata?.inferenceEligible === true,
        inferenceSuppressionReasons: metadata?.inferenceSuppressionReasons ?? [],
    };
}
function fmt(value, digits = 2) {
    if (!Number.isFinite(value))
        return 'n/a';
    return value.toFixed(digits);
}
function holmBonferroni(pValues) {
    const indexed = pValues.map((p, index) => ({ p, index })).sort((a, b) => a.p - b.p);
    const adjusted = new Array(pValues.length).fill(1);
    let runningMax = 0;
    const count = pValues.length;
    indexed.forEach((entry, sortedIndex) => {
        const candidate = Math.min(1, entry.p * (count - sortedIndex));
        runningMax = Math.max(runningMax, candidate);
        adjusted[entry.index] = runningMax;
    });
    return adjusted;
}
function seededLcg(seed) {
    let state = seed >>> 0;
    return () => {
        state = (1664525 * state + 1013904223) >>> 0;
        return state / 0x100000000;
    };
}
function deriveBootstrapSeed(a, b) {
    const cohortData = [...a.cohortRates, ...b.cohortRates];
    const cohortSeed = cohortData.reduce((sum, cohort, index) => sum + cohort.cohort * (index + 17) + cohort.failed * (index + 31) + cohort.total * (index + 47), 0);
    return a.armId.charCodeAt(0) * 1009 +
        b.armId.charCodeAt(0) * 917 +
        a.failed * 131 +
        b.failed * 137 +
        a.total * 149 +
        b.total * 151 +
        cohortSeed;
}
function wilson95(failed, total) {
    if (total <= 0)
        return null;
    const z = 1.959963984540054;
    const rate = failed / total;
    const denominator = 1 + (z * z) / total;
    const center = rate + (z * z) / (2 * total);
    const margin = z * Math.sqrt((rate * (1 - rate)) / total + (z * z) / (4 * total * total));
    return [
        Math.max(0, (center - margin) / denominator),
        Math.min(1, (center + margin) / denominator),
    ];
}
function pairedCohortDifferences(a, b) {
    const bByCohort = new Map(b.cohortRates.map((cohort) => [cohort.cohort, cohort]));
    return a.cohortRates.flatMap((cohortA) => {
        const cohortB = bByCohort.get(cohortA.cohort);
        if (!cohortB || cohortA.total <= 0 || cohortB.total <= 0)
            return [];
        return [(cohortA.failed / cohortA.total - cohortB.failed / cohortB.total) * 100];
    });
}
function pairedCohortTTest(differences) {
    if (differences.length < 2)
        return null;
    const differenceMean = differences.reduce((sum, value) => sum + value, 0) / differences.length;
    const variance = differences.reduce((sum, value) => sum + (value - differenceMean) ** 2, 0) / (differences.length - 1);
    const differenceSd = Math.sqrt(variance);
    if (differenceSd === 0)
        return null;
    const degreesOfFreedom = differences.length - 1;
    const tStatistic = differenceMean / (differenceSd / Math.sqrt(differences.length));
    const pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(tStatistic), degreesOfFreedom));
    return { tStatistic, degreesOfFreedom, pValue };
}
function bootstrapMean95(values, seed, iterations = BOOTSTRAP_ITERATIONS) {
    if (values.length < 2)
        return null;
    const samples = [];
    const random = seededLcg(seed);
    for (let iteration = 0; iteration < iterations; iteration += 1) {
        let sum = 0;
        for (let sample = 0; sample < values.length; sample += 1) {
            sum += values[Math.floor(random() * values.length)];
        }
        samples.push(sum / values.length);
    }
    samples.sort((left, right) => left - right);
    const lowerIndex = Math.floor(iterations * ((1 - BOOTSTRAP_CONFIDENCE_LEVEL) / 2));
    const upperIndex = Math.floor(iterations * (1 - (1 - BOOTSTRAP_CONFIDENCE_LEVEL) / 2));
    return [samples[lowerIndex] ?? Number.NaN, samples[upperIndex] ?? Number.NaN];
}
function bootstrapDelta95(a, b, iterations = BOOTSTRAP_ITERATIONS) {
    return bootstrapMean95(pairedCohortDifferences(a, b), deriveBootstrapSeed(a, b), iterations);
}
function createContrasts(overallArms, inferenceEligible) {
    const pairs = [];
    for (let left = 0; left < overallArms.length; left += 1) {
        for (let right = left + 1; right < overallArms.length; right += 1) {
            const a = overallArms[left];
            const b = overallArms[right];
            pairs.push({
                a,
                b,
                rawP: inferenceEligible ? pairedCohortTTest(pairedCohortDifferences(a, b))?.pValue ?? null : null,
                bootstrapSeed: deriveBootstrapSeed(a, b),
            });
        }
    }
    return pairs;
}
function writeMethod(lines, protocolVerified, inferenceEligible, suppressionReasons) {
    lines.push('## Statistical Method');
    lines.push('');
    lines.push(`- Input provenance: ${protocolVerified ? 'verified isolated cohort aggregate.' : 'UNVERIFIED legacy file-level counts; inferential intervals and tests are suppressed.'}`);
    lines.push(`- Pairwise inferential status: ${inferenceEligible ? 'eligible under the recorded provenance checks.' : `suppressed: ${suppressionReasons.join(' ') || 'required provenance gate failed.'}`}`);
    if (protocolVerified) {
        lines.push('- Prompt protocol: version 2; the guided condition adds one generic security-guidance instruction to an otherwise matched task/system/output prompt.');
    }
    else {
        lines.push('- Legacy prompt and cohort provenance does not satisfy protocol-v2 checks; no inferential results are reported for these inputs.');
    }
    lines.push(`- Contrast family: all six pairwise provider-prompt arm contrasts, paired by common cohort index${protocolVerified ? '.' : ' in protocol v2; not computed for this legacy input.'}`);
    lines.push(`- Inferential unit: one matched cohort block containing one output per mechanism per arm${protocolVerified ? '.' : ' in the planned protocol-v2 analysis.'}`);
    lines.push('- Arm-level marginal failure-rate intervals use Wilson score intervals over output-level binary outcomes.');
    lines.push('- These marginal Wilson intervals are descriptive and treat generation outputs as binomial trials; paired cohort inference is handled separately.');
    lines.push(`- Paired contrast intervals use ${BOOTSTRAP_ITERATIONS} resamples of matched cohort block differences; individual outputs are not resampled independently.`);
    lines.push('- Pairwise interval: equal-tail 95% empirical percentile cluster-bootstrap interval over 30 matched blocks.');
    lines.push(`- Test and adjustment: paired t-tests over block-level percentage-point differences (n = 30; df = 29)${protocolVerified ? ';' : ' (planned protocol-v2 method; not computed for legacy inputs);'} Holm-Bonferroni adjustment across six contrasts.`);
    lines.push('- Pairwise bootstrap seeds are deterministic functions of blinded arm labels and cohort outcomes.');
    lines.push('');
}
function renderUnblindedReport(arms, studyId) {
    const lines = [
        '# AI Provider and Prompt Condition Comparison',
        '',
        `Study ID: ${studyId}`,
        '',
        'This report uses the isolated protocol-v2 cohort aggregates. A failure means that at least one static heuristic check failed; it is not a runtime exploit result or a human security rating.',
        '',
        'The neutral and security-guided prompts share the same system prompt, task framing, model settings, and output limit. The guided prompt adds one generic secure-coding instruction.',
        '',
        '## Failure Rates by Arm',
        '',
        '| Provider | Prompt condition | OAuth failures / n | JWT failures / n | Session failures / n | Overall failures / n | Overall failure rate |',
        '|---|---|---:|---:|---:|---:|---:|',
    ];
    for (const armKey of ARM_KEYS) {
        const arm = arms.find((entry) => entry.key === armKey);
        if (!arm || !arm.protocolVerified) {
            throw new Error(`Cannot render clean AI comparison from unverified arm '${armKey}'.`);
        }
        const [provider, ...promptModeParts] = armKey.split('-');
        const promptMode = promptModeParts.join('-');
        const oauth = rowByLabel(arm.rows, 'OAUTH');
        const jwt = rowByLabel(arm.rows, 'JWT');
        const sessions = rowByLabel(arm.rows, 'SESSIONS');
        const overall = rowByLabel(arm.rows, 'OVERALL');
        if (!oauth || !jwt || !sessions || !overall) {
            throw new Error(`Missing per-model or overall outcome row for '${armKey}'.`);
        }
        lines.push(`| ${provider === 'openai' ? 'OpenAI' : 'Claude'} | ${promptMode} | ${oauth.failedSamples} / ${oauth.totalSamples} | ${jwt.failedSamples} / ${jwt.totalSamples} | ${sessions.failedSamples} / ${sessions.totalSamples} | ${overall.failedSamples} / ${overall.totalSamples} | ${fmt(overall.failureRatePct)}% |`);
    }
    lines.push('', '## Neutral vs Security-Guided Differences', '', 'Differences below are descriptive percentage-point changes (guided minus neutral). No prompt-condition significance claims are made because the study-level inference gate is suppressed.', '', '| Provider | OAuth delta (pp) | JWT delta (pp) | Session delta (pp) | Overall delta (pp) |', '|---|---:|---:|---:|---:|');
    for (const provider of ['openai', 'claude']) {
        const neutral = arms.find((arm) => arm.key === `${provider}-neutral`);
        const guided = arms.find((arm) => arm.key === `${provider}-security-guided`);
        if (!neutral || !guided)
            throw new Error(`Missing neutral/guided arms for '${provider}'.`);
        const deltas = ['OAUTH', 'JWT', 'SESSIONS', 'OVERALL'].map((label) => {
            const neutralRow = rowByLabel(neutral.rows, label);
            const guidedRow = rowByLabel(guided.rows, label);
            if (!neutralRow || !guidedRow)
                throw new Error(`Missing ${label} outcome for '${provider}'.`);
            return guidedRow.failureRatePct - neutralRow.failureRatePct;
        });
        lines.push(`| ${provider === 'openai' ? 'OpenAI' : 'Claude'} | ${deltas.map((delta) => fmt(delta)).join(' | ')} |`);
    }
    const suppressionReasons = [...new Set(arms.flatMap((arm) => arm.inferenceSuppressionReasons))];
    lines.push('', '## Interpretation Limits', '', '- Paired inferential comparisons are suppressed for this study.', `- Suppression reason: ${suppressionReasons.join(' ') || 'the recorded provenance gate failed.'}`, '- Static checks can produce false positives and false negatives; they do not establish semantic correctness, exploitability, or runtime security.', '- The neutral-to-guided contrast estimates the effect of the whole generic guidance instruction, not individual control cues.');
    return `${lines.join('\n')}\n`;
}
function main() {
    const outputPath = path_1.default.join(process.cwd(), report_paths_1.GENERATED_FILES.aiProviderPromptComparisonBlinded);
    const unblindedOutputPath = path_1.default.join(process.cwd(), report_paths_1.GENERATED_FILES.aiProviderPromptComparison);
    const generatedAt = new Date().toISOString();
    const loaded = ARM_KEYS.map(loadArmData).filter((entry) => entry !== null);
    if (loaded.length !== ARM_KEYS.length || !loaded.every((entry) => entry.protocolVerified)) {
        throw new Error('Refusing to generate current AI comparison reports from missing or unverified cohort-v2 arms.');
    }
    const unblindedReport = renderUnblindedReport(loaded, PROVIDER_STUDY_ID ?? DEFAULT_STUDY_ID);
    fs_1.default.writeFileSync(unblindedOutputPath, unblindedReport);
    const lines = [];
    lines.push('# AI Provider/Prompt Comparison (Blinded)');
    lines.push('');
    lines.push(`Generated: ${generatedAt}`);
    lines.push(`Regenerate: npm run compare:ai:providers${PROVIDER_STUDY_ID ? ` -- --study-id ${PROVIDER_STUDY_ID}` : ''}`);
    if (PROVIDER_STUDY_ID) {
        lines.push(`Study ID: ${PROVIDER_STUDY_ID}`);
    }
    lines.push('');
    lines.push('This blinded view hides provider and prompt-condition labels (Arm A-D) to reduce interpretation anchoring bias.');
    lines.push('');
    if (loaded.length === 0) {
        lines.push('No arm results found. Run npm run ai:matrix first.');
        fs_1.default.writeFileSync(outputPath, `${lines.join('\n')}\n`);
        console.log(`Wrote ${outputPath}`);
        return;
    }
    const blinded = loaded
        .sort((a, b) => a.key.localeCompare(b.key))
        .map((entry, index) => ({ armId: String.fromCharCode(65 + index), rows: entry.rows, cohortRates: entry.cohortRates }));
    const protocolVerified = loaded.length === ARM_KEYS.length && loaded.every((entry) => entry.protocolVerified);
    const inferenceEligible = protocolVerified && loaded.every((entry) => entry.inferenceEligible);
    const inferenceSuppressionReasons = [...new Set(loaded.flatMap((entry) => entry.inferenceSuppressionReasons))];
    lines.push('## Blinded Arm Metrics');
    lines.push('');
    lines.push('| Arm | OAUTH Failure % | JWT Failure % | SESSIONS Failure % | Overall Failure % | Overall 95% Wilson CI | Overall Samples |');
    lines.push('|---|---:|---:|---:|---:|---|---:|');
    const overallArms = [];
    for (const arm of blinded) {
        const oauth = rowByLabel(arm.rows, 'OAUTH');
        const jwt = rowByLabel(arm.rows, 'JWT');
        const sessions = rowByLabel(arm.rows, 'SESSIONS');
        const overall = rowByLabel(arm.rows, 'OVERALL');
        const overallCi = protocolVerified && overall ? wilson95(overall.failedSamples, overall.totalSamples) : null;
        const ciText = overallCi ? `[${fmt(overallCi[0] * 100)}, ${fmt(overallCi[1] * 100)}]%` : 'n/a';
        if (overall && overall.totalSamples > 0) {
            overallArms.push({
                armId: arm.armId,
                failed: overall.failedSamples,
                total: overall.totalSamples,
                failureRatePct: overall.failureRatePct,
                cohortRates: arm.cohortRates,
            });
        }
        lines.push(`| Arm ${arm.armId} | ${fmt(oauth?.failureRatePct ?? Number.NaN)} | ${fmt(jwt?.failureRatePct ?? Number.NaN)} | ${fmt(sessions?.failureRatePct ?? Number.NaN)} | ${fmt(overall?.failureRatePct ?? Number.NaN)} | ${ciText} | ${overall?.totalSamples ?? 'n/a'} |`);
    }
    lines.push('');
    writeMethod(lines, protocolVerified, inferenceEligible, inferenceSuppressionReasons);
    lines.push('## Blinded Pairwise Arm Contrasts');
    lines.push('');
    lines.push(`Decision rule: significance requires Holm-adjusted p <= 0.05 and practical effect requires |delta| >= ${fmt(MIN_PRACTICAL_EFFECT_PCT)} percentage points.`);
    lines.push('');
    lines.push('| Arm A | Arm B | Mean Paired Cohort Delta (A-B), pp | 95% Paired-Cohort Bootstrap CI | Bootstrap Seed | Raw Paired t p | Holm-adjusted p | Practical Effect | Significant | Confirmatory-Eligible Contrast |');
    lines.push('|---|---|---:|---|---:|---:|---:|---|---|---|');
    const pairs = createContrasts(overallArms, inferenceEligible);
    const validPValues = pairs.flatMap((pair) => pair.rawP === null ? [] : [pair.rawP]);
    const adjusted = holmBonferroni(validPValues);
    let adjustedIndex = 0;
    for (const pair of pairs) {
        const delta = pair.a.failureRatePct - pair.b.failureRatePct;
        const deltaCi = inferenceEligible ? bootstrapDelta95(pair.a, pair.b) : null;
        const practical = Math.abs(delta) >= MIN_PRACTICAL_EFFECT_PCT;
        if (pair.rawP === null) {
            const ciText = deltaCi ? `[${fmt(deltaCi[0])}, ${fmt(deltaCi[1])}]` : 'n/a';
            lines.push(`| Arm ${pair.a.armId} | Arm ${pair.b.armId} | ${fmt(delta)} | ${ciText} | ${pair.bootstrapSeed} | n/a | n/a | ${practical ? 'Yes' : 'No'} | n/a | No |`);
            continue;
        }
        const holm = adjusted[adjustedIndex];
        adjustedIndex += 1;
        const significant = holm <= 0.05;
        const eligible = significant && practical;
        const ciText = deltaCi ? `[${fmt(deltaCi[0])}, ${fmt(deltaCi[1])}]` : 'n/a';
        lines.push(`| Arm ${pair.a.armId} | Arm ${pair.b.armId} | ${fmt(delta)} | ${ciText} | ${pair.bootstrapSeed} | ${fmt(pair.rawP, 4)} | ${fmt(holm, 4)} | ${practical ? 'Yes' : 'No'} | ${significant ? 'Yes' : 'No'} | ${eligible ? 'Yes' : 'No'} |`);
    }
    lines.push('');
    lines.push('## Usage');
    lines.push('');
    lines.push('- Use this report for first-pass interpretation before viewing unblinded provider labels.');
    if (PROVIDER_STUDY_ID) {
        lines.push(`- For this clean study's unblinded arm identities and provenance, see ai-generated/cohorts/${PROVIDER_STUDY_ID}/study-manifest.json.`);
    }
    else {
        lines.push('- After blind interpretation, compare with docs/generated/AI_PROVIDER_PROMPT_COMPARISON.md for legacy arm identities.');
    }
    fs_1.default.writeFileSync(outputPath, `${lines.join('\n')}\n`);
    if (PROVIDER_STUDY_ID) {
        const studyReportPath = path_1.default.join(process.cwd(), 'ai-generated', 'cohorts', PROVIDER_STUDY_ID, 'reports', path_1.default.basename(outputPath));
        fs_1.default.mkdirSync(path_1.default.dirname(studyReportPath), { recursive: true });
        fs_1.default.copyFileSync(outputPath, studyReportPath);
        fs_1.default.writeFileSync(path_1.default.join(path_1.default.dirname(studyReportPath), path_1.default.basename(unblindedOutputPath)), unblindedReport);
        const manifestPath = path_1.default.join(process.cwd(), 'ai-generated', 'cohorts', PROVIDER_STUDY_ID, 'study-manifest.json');
        if (fs_1.default.existsSync(manifestPath)) {
            const manifest = JSON.parse(fs_1.default.readFileSync(manifestPath, 'utf8'));
            const reportInputs = ARM_KEYS.flatMap((armKey) => [
                path_1.default.join(ARMS_ROOT, armKey, 'metadata.json'),
                path_1.default.join(ARMS_ROOT, armKey, 'results', 'ai-samples-failure-rates.csv'),
            ]);
            const inputSha256 = Object.fromEntries(reportInputs.map((inputPath) => [
                path_1.default.relative(process.cwd(), inputPath),
                crypto_1.default.createHash('sha256').update(fs_1.default.readFileSync(inputPath)).digest('hex'),
            ]));
            delete manifest.blindedReportProvenance;
            manifest.aiComparisonReportProvenance = {
                generatedAt,
                sourceSha256: crypto_1.default.createHash('sha256').update(fs_1.default.readFileSync(__filename)).digest('hex'),
                inputSha256,
                outputs: [
                    path_1.default.relative(process.cwd(), outputPath),
                    path_1.default.relative(process.cwd(), unblindedOutputPath),
                    path_1.default.relative(process.cwd(), studyReportPath),
                    path_1.default.relative(process.cwd(), path_1.default.join(path_1.default.dirname(studyReportPath), path_1.default.basename(unblindedOutputPath))),
                ],
            };
            fs_1.default.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
        }
    }
    console.log(`Wrote ${outputPath}`);
    console.log(`Wrote ${unblindedOutputPath}`);
}
if (require.main === module)
    main();

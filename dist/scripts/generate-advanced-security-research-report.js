"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const variant_test_map_1 = require("../misconfigurations/variant-test-map");
const report_paths_1 = require("./report-paths");
const MODELS = ['oauth', 'jwt', 'sessions'];
function parseCsvLine(line) {
    const values = [];
    let current = '';
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
function readCsv(filePath) {
    const text = fs_1.default.readFileSync(filePath, 'utf8').trim();
    if (!text)
        return [];
    return text.split(/\r?\n/).map(parseCsvLine);
}
function readVariantResults() {
    const filePath = path_1.default.join(process.cwd(), report_paths_1.GENERATED_FILES.variantFocusedJson);
    return JSON.parse(fs_1.default.readFileSync(filePath, 'utf8'));
}
function readAiRows() {
    const filePath = path_1.default.join(process.cwd(), 'ai-generated', 'results', 'ai-samples-summary.csv');
    const rows = readCsv(filePath);
    if (rows.length <= 1)
        return [];
    const header = rows[0];
    const index = new Map();
    for (let i = 0; i < header.length; i += 1) {
        index.set(header[i], i);
    }
    function value(row, key) {
        const idx = index.get(key);
        return idx === undefined ? '' : (row[idx] ?? '');
    }
    return rows.slice(1).map((row) => ({
        model: value(row, 'model'),
        sample: value(row, 'sample'),
        passed: value(row, 'passed').toLowerCase() === 'true',
        characters: Number(value(row, 'characters')),
        lines: Number(value(row, 'lines')),
        functions: Number(value(row, 'functions')),
        classes: Number(value(row, 'classes')),
        cyclomaticComplexity: Number(value(row, 'cyclomaticComplexity')),
        maintainabilityIndex: Number(value(row, 'maintainabilityIndex')),
        correctnessFailures: value(row, 'correctnessFailures'),
        securityFailures: value(row, 'securityFailures'),
        misconfigurationDetections: value(row, 'misconfigurationDetections'),
    }));
}
function readCodeFootprint() {
    const filePath = path_1.default.join(process.cwd(), report_paths_1.GENERATED_FILES.codeFootprintJson);
    return JSON.parse(fs_1.default.readFileSync(filePath, 'utf8'));
}
function avg(values) {
    if (values.length === 0)
        return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}
function sum(values) {
    return values.reduce((acc, value) => acc + value, 0);
}
function stddev(values) {
    if (values.length === 0)
        return 0;
    const mean = avg(values);
    const variance = avg(values.map((v) => (v - mean) ** 2));
    return Math.sqrt(variance);
}
function fmt(value, digits = 2) {
    if (!Number.isFinite(value))
        return 'n/a';
    return value.toFixed(digits);
}
function splitTags(raw) {
    return raw
        .split('|')
        .map((tag) => tag.trim())
        .filter(Boolean)
        .filter((tag) => tag.toLowerCase() !== 'none');
}
function classifyTag(tag) {
    const lower = tag.toLowerCase();
    if (lower.includes('state'))
        return 'missing/weak state';
    if (lower.includes('redirect'))
        return 'redirect validation';
    if (lower.includes('scope'))
        return 'scope control';
    if (lower.includes('audience') || lower.includes('issuer'))
        return 'audience/issuer validation';
    if (lower.includes('algorithm') || lower.includes('alg'))
        return 'algorithm enforcement';
    if (lower.includes('expiry') || lower.includes('expire'))
        return 'token lifetime';
    if (lower.includes('session regeneration') || lower.includes('fixation'))
        return 'session fixation resistance';
    if (lower.includes('httponly') || lower.includes('cookie'))
        return 'cookie hardening';
    if (lower.includes('logout') || lower.includes('invalidation'))
        return 'session invalidation';
    return 'other security control';
}
function propagationForVariant(variantName) {
    if (variantName === 'jwt-algorithm-misconfiguration') {
        return [
            'Weak/none JWT signature validation',
            'Token forgery',
            'Session or access-control bypass',
            'Privilege escalation',
        ];
    }
    if (variantName === 'oauth-state-misconfiguration') {
        return [
            'Missing or unchecked OAuth state',
            'CSRF on authorization response',
            'Wrong user session binding',
            'Data leakage / account confusion',
        ];
    }
    if (variantName === 'oauth-redirect-misconfiguration') {
        return [
            'Untrusted redirect URI accepted',
            'Authorization code interception',
            'Code replay at attacker endpoint',
            'Unauthorized token issuance',
        ];
    }
    if (variantName === 'oauth-scope-misconfiguration') {
        return [
            'Over-broad scope assignment',
            'Token carries elevated privileges',
            'Access-control boundary erosion',
            'Privilege abuse on protected resources',
        ];
    }
    if (variantName === 'jwt-audience-misconfiguration') {
        return [
            'Weak audience/issuer checks',
            'Cross-service token acceptance',
            'Improper trust transfer',
            'Unauthorized API access',
        ];
    }
    if (variantName === 'jwt-expiry-misconfiguration') {
        return [
            'Excessive token lifetime',
            'Extended replay window',
            'Persisting unauthorized access',
            'Delayed incident containment',
        ];
    }
    if (variantName === 'sessions-fixation-misconfiguration') {
        return [
            'Session ID not rotated on login',
            'Attacker-known session remains valid',
            'Victim identity bound to attacker session',
            'Full authenticated takeover',
        ];
    }
    if (variantName === 'sessions-cookie-flag-misconfiguration') {
        return [
            'Missing HttpOnly cookie flag',
            'Cookie disclosure via script/XSS',
            'Session replay',
            'Authenticated data exposure',
        ];
    }
    return [
        'Session not invalidated on logout',
        'Stolen cookie remains usable',
        'Replay after apparent sign-out',
        'Unauthorized persistence',
    ];
}
function linearRegression(points) {
    const n = points.length;
    if (n === 0)
        return { slope: 0, intercept: 0 };
    const xMean = avg(points.map((p) => p.x));
    const yMean = avg(points.map((p) => p.y));
    const numerator = sum(points.map((p) => (p.x - xMean) * (p.y - yMean)));
    const denominator = sum(points.map((p) => (p.x - xMean) ** 2));
    if (denominator === 0)
        return { slope: 0, intercept: yMean };
    const slope = numerator / denominator;
    return { slope, intercept: yMean - slope * xMean };
}
function writeReport() {
    const generatedAt = new Date().toISOString();
    const variants = readVariantResults();
    const aiRows = readAiRows();
    const footprint = readCodeFootprint();
    const lines = [];
    lines.push('# Advanced Security Research Analysis');
    lines.push('');
    lines.push(`Generated: ${generatedAt}`);
    lines.push('Regenerate: npm run research:advanced');
    lines.push('');
    lines.push('This report operationalizes advanced dissertation analyses over the existing baseline, controlled misconfiguration, and AI-generated evidence layers.');
    lines.push('');
    lines.push('## 1) Misconfiguration Propagation Analysis');
    lines.push('');
    lines.push('| Variant | Severity | Propagation Chain | Secondary Failure Triggered | Proof |');
    lines.push('|---|---|---|---|---|');
    for (const variant of variants) {
        const meta = variant_test_map_1.variantTestMap[variant.variantName];
        const chain = propagationForVariant(variant.variantName).join(' -> ');
        const secondaryTriggered = variant.passed ? 'Yes' : 'No';
        lines.push(`| ${variant.variantName} | ${meta.severityClass} (${meta.severityScore}) | ${chain} | ${secondaryTriggered} | ${variant.passed ? 'PASS' : 'FAIL'} |`);
    }
    lines.push('');
    lines.push('Interpretation: propagation chains model how a single configuration weakness can trigger downstream security failures across identity, session, and authorization layers.');
    lines.push('');
    lines.push('## 2) Cross-Model Misconfiguration Mapping');
    lines.push('');
    const mappingRows = [
        {
            name: 'Missing/weak OAuth state',
            oauth: 'Yes',
            jwt: 'No',
            sessions: 'No',
            severe: 'Low (2)',
            scope: 'Model-specific',
        },
        {
            name: 'Weak JWT algorithm enforcement',
            oauth: 'No',
            jwt: 'Yes',
            sessions: 'No',
            severe: 'Critical (5)',
            scope: 'Model-specific',
        },
        {
            name: 'Cookie hardening failure',
            oauth: 'No',
            jwt: 'No',
            sessions: 'Yes',
            severe: 'High (4)',
            scope: 'Model-specific',
        },
        {
            name: 'Trust-boundary validation weakness',
            oauth: 'Yes',
            jwt: 'Yes',
            sessions: 'Yes',
            severe: 'High-Critical',
            scope: 'Cross-model pattern',
        },
    ];
    lines.push('| Misconfiguration Pattern | OAuth2 | JWT | Sessions | Typical Severity | Classification |');
    lines.push('|---|---|---|---|---|---|');
    for (const row of mappingRows) {
        lines.push(`| ${row.name} | ${row.oauth} | ${row.jwt} | ${row.sessions} | ${row.severe} | ${row.scope} |`);
    }
    lines.push('');
    for (const model of MODELS) {
        const modelVariants = variants.filter((v) => v.category === model);
        const modelSeverity = avg(modelVariants.map((v) => variant_test_map_1.variantTestMap[v.variantName].severityScore));
        lines.push(`- ${model.toUpperCase()} average severity score: ${fmt(modelSeverity)}.`);
    }
    lines.push('');
    lines.push('## 3) AI Misconfiguration Signature Analysis');
    lines.push('');
    const signatureCounts = new Map();
    for (const row of aiRows.filter((r) => !r.passed)) {
        const tags = [...splitTags(row.securityFailures), ...splitTags(row.misconfigurationDetections)];
        for (const tag of tags) {
            const label = classifyTag(tag);
            const current = signatureCounts.get(label) ?? { count: 0, models: new Set() };
            current.count += 1;
            current.models.add(row.model.toUpperCase());
            signatureCounts.set(label, current);
        }
    }
    lines.push('| AI Signature Pattern | Frequency | Models Affected |');
    lines.push('|---|---:|---|');
    const sortedSignatures = [...signatureCounts.entries()].sort((a, b) => b[1].count - a[1].count);
    for (const [pattern, data] of sortedSignatures) {
        lines.push(`| ${pattern} | ${data.count} | ${[...data.models].sort().join(', ')} |`);
    }
    lines.push('');
    lines.push('Finding: recurring tags form an AI misconfiguration fingerprint, showing repeated control omissions rather than uniformly random errors.');
    lines.push('');
    lines.push('## 4) Security vs Complexity Regression Curve');
    lines.push('');
    const baselineComplexityDensity = avg(footprint.baselineMetrics.map((m) => m.lines > 0 ? (m.cyclomaticComplexity / m.lines) * 100 : 0));
    const variantComplexityDensity = avg(footprint.variantMetrics.map((m) => m.lines > 0 ? (m.cyclomaticComplexity / m.lines) * 100 : 0));
    const aiComplexityDensity = avg(aiRows.map((r) => (r.lines > 0 ? (r.cyclomaticComplexity / r.lines) * 100 : 0)));
    const baselineRisk = 0;
    const variantRisk = variants.length > 0 ? (variants.filter((v) => v.passed).length / variants.length) * 100 : 0;
    const aiRisk = aiRows.length > 0 ? (aiRows.filter((r) => !r.passed).length / aiRows.length) * 100 : 0;
    const curvePoints = [
        { label: 'Baseline', x: baselineComplexityDensity, y: baselineRisk },
        { label: 'Misconfigured', x: variantComplexityDensity, y: variantRisk },
        { label: 'AI-generated', x: aiComplexityDensity, y: aiRisk },
    ];
    const regression = linearRegression(curvePoints.map((p) => ({ x: p.x, y: p.y })));
    lines.push('| Layer | Complexity Density (Cyclomatic per 100 LOC) (X) | Security Burden Rate % (Y) |');
    lines.push('|---|---:|---:|');
    for (const point of curvePoints) {
        lines.push(`| ${point.label} | ${fmt(point.x)} | ${fmt(point.y)} |`);
    }
    lines.push('');
    lines.push(`Regression line estimate: y = ${fmt(regression.slope)}x + ${fmt(regression.intercept)}.`);
    lines.push('');
    lines.push('## 5) Authentication Model Difficulty Index (AMDI)');
    lines.push('');
    const maxBaselineComplexity = Math.max(...footprint.baselineMetrics.map((m) => m.cyclomaticComplexity), 1);
    const modelAmdiRows = [];
    lines.push('| Model | Complexity Factor | Moving Parts | Validation Evidence | Misconfiguration Points | Dependency Surface | AMDI (0-100) |');
    lines.push('|---|---:|---:|---:|---:|---:|---:|');
    for (const model of MODELS) {
        const baselineMetric = footprint.baselineMetrics.find((m) => m.label.toLowerCase().includes(model));
        const modelVariantNames = Object.keys(variant_test_map_1.variantTestMap).filter((name) => variant_test_map_1.variantTestMap[name].category === model);
        const complexityFactor = baselineMetric
            ? (baselineMetric.cyclomaticComplexity / maxBaselineComplexity) * 100
            : 0;
        const movingParts = baselineMetric?.fileCount ?? 0;
        const validationEvidence = sum(modelVariantNames.map((name) => variant_test_map_1.variantTestMap[name].baselineEvidence.length));
        const misconfigPoints = modelVariantNames.length;
        const dependencySurface = (baselineMetric?.constants ?? 0) + (baselineMetric?.classes ?? 0);
        const amdiScore = 0.35 * complexityFactor +
            0.2 * movingParts * 10 +
            0.2 * validationEvidence * 5 +
            0.15 * misconfigPoints * 10 +
            0.1 * dependencySurface * 5;
        const modelAiRows = aiRows.filter((row) => row.model === model);
        const aiFailureRate = modelAiRows.length
            ? (modelAiRows.filter((row) => !row.passed).length / modelAiRows.length) * 100
            : 0;
        modelAmdiRows.push({ model: model.toUpperCase(), score: amdiScore, aiFailureRate });
        lines.push(`| ${model.toUpperCase()} | ${fmt(complexityFactor)} | ${movingParts} | ${validationEvidence} | ${misconfigPoints} | ${dependencySurface} | ${fmt(amdiScore)} |`);
    }
    lines.push('');
    lines.push('AMDI is an original composite index in this repository and can be used to compare model difficulty against observed AI failure rates.');
    lines.push('');
    lines.push('## 6) AI Determinism Analysis');
    lines.push('');
    lines.push('| Model | Security Pass Rate | Cyclomatic StdDev | Maintainability StdDev | Security-Failure Tag Diversity |');
    lines.push('|---|---:|---:|---:|---:|');
    for (const model of MODELS) {
        const rows = aiRows.filter((row) => row.model === model);
        const passRate = rows.length ? (rows.filter((r) => r.passed).length / rows.length) * 100 : 0;
        const cycloStd = stddev(rows.map((r) => r.cyclomaticComplexity));
        const maintStd = stddev(rows.map((r) => r.maintainabilityIndex));
        const tagSet = new Set();
        for (const row of rows) {
            for (const tag of splitTags(row.securityFailures)) {
                tagSet.add(classifyTag(tag));
            }
        }
        lines.push(`| ${model.toUpperCase()} | ${fmt(passRate)}% | ${fmt(cycloStd)} | ${fmt(maintStd)} | ${tagSet.size} |`);
    }
    lines.push('');
    lines.push('Interpretation: non-zero variance in complexity and security outcomes demonstrates instability of generated security quality across nominally similar samples.');
    lines.push('');
    lines.push('## 7) Security Correctness vs Functional Correctness Gap');
    lines.push('');
    let bothPass = 0;
    let functionalOnlyPass = 0;
    let securityOnlyPass = 0;
    let bothFail = 0;
    for (const row of aiRows) {
        const functionalPass = splitTags(row.correctnessFailures).length === 0;
        const securityPass = row.passed;
        if (functionalPass && securityPass)
            bothPass += 1;
        else if (functionalPass && !securityPass)
            functionalOnlyPass += 1;
        else if (!functionalPass && securityPass)
            securityOnlyPass += 1;
        else
            bothFail += 1;
    }
    lines.push('| Outcome Type | Sample Count | Meaning |');
    lines.push('|---|---:|---|');
    lines.push(`| Functional PASS + Security PASS | ${bothPass} | Correct and secure under current local checks. |`);
    lines.push(`| Functional PASS + Security FAIL | ${functionalOnlyPass} | Correctness-security gap (appears correct but insecure). |`);
    lines.push(`| Functional FAIL + Security PASS | ${securityOnlyPass} | Functionality failure without flagged security omission. |`);
    lines.push(`| Functional FAIL + Security FAIL | ${bothFail} | Broad quality failure affecting correctness and security. |`);
    lines.push('');
    lines.push('## 8) Exploit Simulation Evidence');
    lines.push('');
    lines.push('| Exploit Scenario | Model | Variant | Exploitability (0-10) | Focused Proof |');
    lines.push('|---|---|---|---:|---|');
    const exploitScenarioByVariant = {
        'oauth-redirect-misconfiguration': 'Redirect hijack / authorization-code interception',
        'oauth-state-misconfiguration': 'Authorization CSRF / session confusion',
        'oauth-scope-misconfiguration': 'Privilege escalation via over-broad scopes',
        'jwt-audience-misconfiguration': 'Cross-audience token replay',
        'jwt-algorithm-misconfiguration': 'Token forgery via weak algorithm',
        'jwt-expiry-misconfiguration': 'Extended replay window abuse',
        'sessions-fixation-misconfiguration': 'Session fixation takeover',
        'sessions-cookie-flag-misconfiguration': 'Cookie theft and replay',
        'sessions-logout-misconfiguration': 'Post-logout replay',
    };
    for (const variant of variants) {
        const meta = variant_test_map_1.variantTestMap[variant.variantName];
        lines.push(`| ${exploitScenarioByVariant[variant.variantName]} | ${variant.category.toUpperCase()} | ${variant.variantName} | ${meta.exploitabilityScore10} | ${variant.passed ? 'PASS' : 'FAIL'} |`);
    }
    lines.push('');
    lines.push('## 9) Developer Effort vs Security Outcome');
    lines.push('');
    lines.push('| Model | Layer | Avg Chars | Avg Lines | Avg Functions | Avg Cyclomatic | Security Outcome |');
    lines.push('|---|---|---:|---:|---:|---:|---|');
    for (const model of MODELS) {
        const baseline = footprint.baselineMetrics.find((m) => m.label.toLowerCase().includes(model));
        const modelVariants = footprint.variantMetrics.filter((m) => m.label.startsWith(model));
        const modelAi = aiRows.filter((row) => row.model === model);
        const variantAvgChars = avg(modelVariants.map((m) => m.characters));
        const variantAvgLines = avg(modelVariants.map((m) => m.lines));
        const variantAvgFunctions = avg(modelVariants.map((m) => m.functions));
        const variantAvgCyclo = avg(modelVariants.map((m) => m.cyclomaticComplexity));
        const aiFailureRate = modelAi.length
            ? (modelAi.filter((row) => !row.passed).length / modelAi.length) * 100
            : 0;
        lines.push(`| ${model.toUpperCase()} | Baseline | ${fmt(baseline?.characters ?? 0)} | ${fmt(baseline?.lines ?? 0)} | ${fmt(baseline?.functions ?? 0)} | ${fmt(baseline?.cyclomaticComplexity ?? 0)} | Secure baseline reference |`);
        lines.push(`| ${model.toUpperCase()} | Misconfigured | ${fmt(variantAvgChars)} | ${fmt(variantAvgLines)} | ${fmt(variantAvgFunctions)} | ${fmt(variantAvgCyclo)} | Intentional exploit proofs: ${variants.filter((v) => v.category === model && v.passed).length} / ${variants.filter((v) => v.category === model).length} |`);
        lines.push(`| ${model.toUpperCase()} | AI-generated | ${fmt(avg(modelAi.map((r) => r.characters)))} | ${fmt(avg(modelAi.map((r) => r.lines)))} | ${fmt(avg(modelAi.map((r) => r.functions)))} | ${fmt(avg(modelAi.map((r) => r.cyclomaticComplexity)))} | Security failure rate: ${fmt(aiFailureRate)}% |`);
    }
    lines.push('');
    lines.push('## Notes and Caveats');
    lines.push('');
    lines.push('- AI analyses are based on current heuristic checks; semantic runtime verification of AI samples is a future extension.');
    lines.push('- Exploit simulation evidence references controlled attack and variant tests already in this repository.');
    lines.push('- AMDI is intentionally transparent and can be re-weighted for sensitivity analysis.');
    const outputPath = path_1.default.join(process.cwd(), report_paths_1.GENERATED_FILES.advancedResearchAnalysis);
    fs_1.default.writeFileSync(outputPath, `${lines.join('\n')}\n`);
    console.log(`Wrote ${report_paths_1.GENERATED_FILES.advancedResearchAnalysis}`);
}
writeReport();

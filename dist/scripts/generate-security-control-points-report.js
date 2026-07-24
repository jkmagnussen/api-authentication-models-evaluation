"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const report_paths_1 = require("./report-paths");
const CONTROL_DEFINITIONS = [
    {
        controlId: 'oauth_redirect_uri_validation',
        model: 'oauth',
        controlLabel: 'OAuth redirect URI validation',
        controlDescription: 'Authorization redirects must be strictly matched against trusted callback URIs.',
        canonicalSeverity10: 9,
    },
    {
        controlId: 'oauth_state_binding',
        model: 'oauth',
        controlLabel: 'OAuth state binding',
        controlDescription: 'Authorization code exchange must fail when state does not match.',
        canonicalSeverity10: 10,
    },
    {
        controlId: 'oauth_scope_enforcement',
        model: 'oauth',
        controlLabel: 'OAuth scope enforcement',
        controlDescription: 'Token issuance must not grant over-privileged scopes.',
        canonicalSeverity10: 6,
    },
    {
        controlId: 'jwt_audience_issuer_validation',
        model: 'jwt',
        controlLabel: 'JWT audience and issuer validation',
        controlDescription: 'Accepted JWTs must match trusted audience and issuer constraints.',
        canonicalSeverity10: 8,
    },
    {
        controlId: 'jwt_algorithm_allowlist',
        model: 'jwt',
        controlLabel: 'JWT algorithm allowlist',
        controlDescription: 'Token verification must reject disallowed or unsigned algorithm values.',
        canonicalSeverity10: 10,
    },
    {
        controlId: 'jwt_expiry_enforcement',
        model: 'jwt',
        controlLabel: 'JWT expiry enforcement',
        controlDescription: 'Token lifetime should remain bounded to expected session duration.',
        canonicalSeverity10: 7,
    },
    {
        controlId: 'session_regeneration_on_auth',
        model: 'sessions',
        controlLabel: 'Session regeneration on authentication',
        controlDescription: 'Session identifiers should rotate across authentication boundaries.',
        canonicalSeverity10: 8,
    },
    {
        controlId: 'session_cookie_protection',
        model: 'sessions',
        controlLabel: 'Session cookie protection',
        controlDescription: 'Session cookies should keep security flags such as HttpOnly and secure transport constraints.',
        canonicalSeverity10: 7,
    },
    {
        controlId: 'session_invalidation_on_logout',
        model: 'sessions',
        controlLabel: 'Session invalidation on logout',
        controlDescription: 'Logout should revoke server-side session state to prevent replay.',
        canonicalSeverity10: 8,
    },
];
const VARIANT_TO_CONTROL_ID = {
    'oauth-redirect-misconfiguration': 'oauth_redirect_uri_validation',
    'oauth-state-misconfiguration': 'oauth_state_binding',
    'oauth-scope-misconfiguration': 'oauth_scope_enforcement',
    'jwt-audience-misconfiguration': 'jwt_audience_issuer_validation',
    'jwt-algorithm-misconfiguration': 'jwt_algorithm_allowlist',
    'jwt-expiry-misconfiguration': 'jwt_expiry_enforcement',
    'sessions-fixation-misconfiguration': 'session_regeneration_on_auth',
    'sessions-cookie-flag-misconfiguration': 'session_cookie_protection',
    'sessions-logout-misconfiguration': 'session_invalidation_on_logout',
};
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
function normalizeModelName(label) {
    const s = label.toLowerCase();
    if (s.startsWith('oauth'))
        return 'oauth';
    if (s.startsWith('jwt'))
        return 'jwt';
    return 'sessions';
}
function displayModelName(model) {
    if (model === 'oauth')
        return 'OAuth2';
    if (model === 'jwt')
        return 'JWT';
    return 'Session';
}
function splitTags(raw) {
    return raw
        .split('|')
        .map((tag) => tag.trim())
        .filter(Boolean);
}
function classifyTagToControlId(tag) {
    const lower = tag.toLowerCase();
    if (lower.includes('redirect'))
        return 'oauth_redirect_uri_validation';
    if (/\bstate\b/.test(lower))
        return 'oauth_state_binding';
    if (lower.includes('scope'))
        return 'oauth_scope_enforcement';
    if (lower.includes('audience') || lower.includes('issuer'))
        return 'jwt_audience_issuer_validation';
    if (lower.includes('algorithm') || lower.includes('alg') || lower.includes('signature'))
        return 'jwt_algorithm_allowlist';
    if (lower.includes('expiry') ||
        lower.includes('expire') ||
        lower.includes('lifetime') ||
        lower.includes('ttl')) {
        return 'jwt_expiry_enforcement';
    }
    if (lower.includes('session regeneration') ||
        lower.includes('regeneration') ||
        lower.includes('fixation')) {
        return 'session_regeneration_on_auth';
    }
    if (lower.includes('cookie') ||
        lower.includes('httponly') ||
        lower.includes('secure') ||
        lower.includes('samesite')) {
        return 'session_cookie_protection';
    }
    if (lower.includes('logout') || lower.includes('invalidation') || lower.includes('replay')) {
        return 'session_invalidation_on_logout';
    }
    return undefined;
}
function density(numerator, denominator, scale) {
    if (!Number.isFinite(denominator) || denominator <= 0)
        return 0;
    return (numerator / denominator) * scale;
}
function average(values) {
    if (values.length === 0)
        return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}
function readFootprintJson() {
    return JSON.parse(fs_1.default.readFileSync(path_1.default.join(process.cwd(), report_paths_1.GENERATED_FILES.codeFootprintJson), 'utf8'));
}
function readVariantResults() {
    return JSON.parse(fs_1.default.readFileSync(path_1.default.join(process.cwd(), report_paths_1.GENERATED_FILES.variantFocusedJson), 'utf8'));
}
function readAiRows() {
    const rows = readCsv(path_1.default.join(process.cwd(), 'ai-generated', 'results', 'ai-samples-summary.csv'));
    const [, ...body] = rows;
    return body.map((row) => ({
        model: row[0],
        passed: row[2] === 'true',
        securityFailures: row[13] ?? '',
    }));
}
function getModelCharsBySource(footprint) {
    const baseline = { oauth: 0, jwt: 0, sessions: 0 };
    for (const metric of footprint.baselineMetrics) {
        baseline[normalizeModelName(metric.label)] = metric.characters;
    }
    const misconfiguration = { oauth: 0, jwt: 0, sessions: 0 };
    for (const model of ['oauth', 'jwt', 'sessions']) {
        const items = footprint.variantMetrics.filter((metric) => normalizeModelName(metric.label) === model);
        misconfiguration[model] = average(items.map((item) => item.characters));
    }
    const ai = { oauth: 0, jwt: 0, sessions: 0 };
    for (const metric of footprint.aiMetrics) {
        ai[normalizeModelName(metric.label)] = metric.characters;
    }
    return { baseline, misconfiguration, ai };
}
function buildRows() {
    const footprint = readFootprintJson();
    const variants = readVariantResults();
    const aiRows = readAiRows();
    const charsBySource = getModelCharsBySource(footprint);
    const variantMetricByName = new Map(footprint.variantMetrics.map((metric) => [metric.label, metric]));
    const rows = [];
    for (const def of CONTROL_DEFINITIONS) {
        rows.push({
            model: def.model,
            modelLabel: displayModelName(def.model),
            controlId: def.controlId,
            controlLabel: def.controlLabel,
            source: 'baseline',
            characters: charsBySource.baseline[def.model],
            failureEvents: 0,
            severity10: def.canonicalSeverity10,
            weightedRisk: 0,
            failuresPer10kChars: 0,
            riskPer10kChars: 0,
        });
    }
    for (const def of CONTROL_DEFINITIONS) {
        const variantName = Object.keys(VARIANT_TO_CONTROL_ID).find((key) => VARIANT_TO_CONTROL_ID[key] === def.controlId);
        const variantResult = variantName
            ? variants.find((variant) => variant.variantName === variantName)
            : undefined;
        const variantMetric = variantName ? variantMetricByName.get(variantName) : undefined;
        const failureEvents = variantResult?.passed ? 1 : 0;
        const severity10 = variantResult?.exploitabilityScore10 ?? def.canonicalSeverity10;
        const characters = variantMetric?.characters ?? charsBySource.misconfiguration[def.model];
        const weightedRisk = failureEvents * severity10;
        rows.push({
            model: def.model,
            modelLabel: displayModelName(def.model),
            controlId: def.controlId,
            controlLabel: def.controlLabel,
            source: 'misconfiguration',
            characters,
            failureEvents,
            severity10,
            weightedRisk,
            failuresPer10kChars: density(failureEvents, characters, 10000),
            riskPer10kChars: density(weightedRisk, characters, 10000),
        });
    }
    for (const def of CONTROL_DEFINITIONS) {
        const modelAiRows = aiRows.filter((row) => row.model === def.model && !row.passed);
        let failureEvents = 0;
        for (const row of modelAiRows) {
            const controlMatches = new Set(splitTags(row.securityFailures)
                .map(classifyTagToControlId)
                .filter((controlId) => typeof controlId === 'string'));
            if (controlMatches.has(def.controlId)) {
                failureEvents += 1;
            }
        }
        const characters = charsBySource.ai[def.model];
        const weightedRisk = failureEvents * def.canonicalSeverity10;
        rows.push({
            model: def.model,
            modelLabel: displayModelName(def.model),
            controlId: def.controlId,
            controlLabel: def.controlLabel,
            source: 'ai',
            characters,
            failureEvents,
            severity10: def.canonicalSeverity10,
            weightedRisk,
            failuresPer10kChars: density(failureEvents, characters, 10000),
            riskPer10kChars: density(weightedRisk, characters, 10000),
        });
    }
    const modelSummary = [];
    for (const model of ['oauth', 'jwt', 'sessions']) {
        for (const source of ['baseline', 'misconfiguration', 'ai']) {
            const modelRows = rows.filter((row) => row.model === model && row.source === source);
            modelSummary.push({
                model,
                modelLabel: displayModelName(model),
                source,
                controlCount: modelRows.length,
                charactersMean: average(modelRows.map((row) => row.characters)),
                failureEventsTotal: modelRows.reduce((sum, row) => sum + row.failureEvents, 0),
                weightedRiskTotal: modelRows.reduce((sum, row) => sum + row.weightedRisk, 0),
                avgFailuresPer10kChars: average(modelRows.map((row) => row.failuresPer10kChars)),
                avgRiskPer10kChars: average(modelRows.map((row) => row.riskPer10kChars)),
            });
        }
    }
    return {
        generatedAt: new Date().toISOString(),
        definitions: CONTROL_DEFINITIONS,
        rows,
        modelSummary,
    };
}
function writeJson(payload) {
    fs_1.default.writeFileSync(path_1.default.join(process.cwd(), report_paths_1.GENERATED_FILES.securityControlPointsJson), JSON.stringify(payload, null, 2));
}
function writeMarkdown(payload) {
    const lines = [];
    lines.push('# Security-Critical Control Points');
    lines.push('');
    lines.push(`Generated: ${payload.generatedAt}`);
    lines.push('Regenerate: npm run code:footprint:tolerant');
    lines.push('');
    lines.push('This exploratory report isolates high-impact control points and expresses observed failure pressure as density relative to implementation footprint.');
    lines.push('');
    lines.push('## Control Definitions');
    lines.push('');
    lines.push('| Model | Control Point | Canonical Severity (0-10) | Description |');
    lines.push('|---|---|---:|---|');
    for (const def of payload.definitions) {
        lines.push(`| ${displayModelName(def.model)} | ${def.controlLabel} | ${def.canonicalSeverity10} | ${def.controlDescription} |`);
    }
    lines.push('');
    lines.push('## Control-Point Exposure');
    lines.push('');
    lines.push('| Model | Source | Control Point | Chars | Failure Events | Severity (0-10) | Weighted Risk | Failures / 10k Chars | Risk / 10k Chars |');
    lines.push('|---|---|---|---:|---:|---:|---:|---:|---:|');
    for (const row of payload.rows) {
        lines.push(`| ${row.modelLabel} | ${row.source} | ${row.controlLabel} | ${Math.round(row.characters)} | ${row.failureEvents} | ${row.severity10.toFixed(1)} | ${row.weightedRisk.toFixed(1)} | ${row.failuresPer10kChars.toFixed(3)} | ${row.riskPer10kChars.toFixed(3)} |`);
    }
    lines.push('');
    lines.push('## Model-Level Aggregates');
    lines.push('');
    lines.push('| Model | Source | Controls | Mean Chars | Failure Events Total | Weighted Risk Total | Avg Failures / 10k Chars | Avg Risk / 10k Chars |');
    lines.push('|---|---|---:|---:|---:|---:|---:|---:|');
    for (const row of payload.modelSummary) {
        lines.push(`| ${row.modelLabel} | ${row.source} | ${row.controlCount} | ${Math.round(row.charactersMean)} | ${row.failureEventsTotal} | ${row.weightedRiskTotal.toFixed(1)} | ${row.avgFailuresPer10kChars.toFixed(3)} | ${row.avgRiskPer10kChars.toFixed(3)} |`);
    }
    lines.push('');
    lines.push('## Notes');
    lines.push('');
    lines.push('- Baseline rows represent denominator context and intentionally carry zero observed failures.');
    lines.push('- Misconfiguration rows map one intentional variant to one principal control-point regression.');
    lines.push("- AI rows map failed sample tags to control points and apply canonical severity from the model's paired variant taxonomy.");
    fs_1.default.writeFileSync(path_1.default.join(process.cwd(), report_paths_1.GENERATED_FILES.securityControlPointsSummary), `${lines.join('\n')}\n`);
}
function main() {
    const payload = buildRows();
    writeJson(payload);
    writeMarkdown(payload);
    console.log(`Wrote ${report_paths_1.GENERATED_FILES.securityControlPointsSummary}`);
    console.log(`Wrote ${report_paths_1.GENERATED_FILES.securityControlPointsJson}`);
}
main();

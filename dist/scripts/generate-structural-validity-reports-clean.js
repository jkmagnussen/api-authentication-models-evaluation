"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const report_paths_1 = require("./report-paths");
const MODEL_ORDER = ["oauth", "jwt", "sessions"];
const MODEL_PROFILES = {
    oauth: { label: "OAuth2", configPoints: 8, securityFlags: 6, lifecycleSteps: 7, trustBoundaryCrossings: 5, validationRules: 7, mustRememberBehaviors: 6, propagationReading: "OAuth2 mistakes propagate non-linearly because redirect, state, code, token, and scope checks compound across multiple trust boundaries." },
    jwt: { label: "JWT", configPoints: 7, securityFlags: 5, lifecycleSteps: 5, trustBoundaryCrossings: 3, validationRules: 6, mustRememberBehaviors: 5, propagationReading: "JWT mistakes tend to propagate linearly through token issuance and validation rules, especially where signature and claim checks are weakened." },
    sessions: { label: "Session", configPoints: 8, securityFlags: 5, lifecycleSteps: 5, trustBoundaryCrossings: 3, validationRules: 5, mustRememberBehaviors: 5, propagationReading: "Session mistakes often amplify quickly because one cookie or invalidation weakness can spill into replay, fixation, and impersonation outcomes." },
};
const BOUNDARY_ANALYSIS = {
    oauth: { primaryBoundary: "Redirect / authorization-code boundary", attackEvidence: ["tests/attacks/oauth/redirect.test.ts", "tests/attacks/oauth/state.test.ts", "tests/attacks/oauth/replay.test.ts", "tests/attacks/oauth/scope-escalation.high-impact.test.ts"], structuralFailure: "Incorrect redirect, state, or scope handling crosses browser, client, and authorization-server boundaries before reaching the resource layer.", reading: "OAuth2 fails structurally at the redirect and response-binding boundaries, where a single trust-transfer error contaminates multiple downstream stages." },
    jwt: { primaryBoundary: "Client storage / token-validation boundary", attackEvidence: ["tests/attacks/jwt/audience-issuer-mismatch.test.ts", "tests/attacks/jwt/claim-abuse.test.ts"], structuralFailure: "The main structural failure occurs when untrusted tokens cross from client-controlled storage or transport into server-side validation with weakened checks.", reading: "JWT failures are concentrated at the token-validation boundary: fewer hops than OAuth2, but high precision stress on signature and claim discipline." },
    sessions: { primaryBoundary: "Browser cookie / server session boundary", attackEvidence: ["tests/attacks/sessions/csrf.test.ts", "tests/attacks/sessions/fixation.test.ts", "tests/attacks/auth.security.test.ts"], structuralFailure: "Browser-managed cookies cross into server trust with auto-send behavior, making hidden browser defaults a key structural risk surface.", reading: "Sessions fail structurally at the browser boundary: cookies are easy to deploy, but browser behavior can silently magnify mistakes." },
};
const PROTOCOL_EXPECTATIONS = {
    oauth: [
        { assumption: "State binding prevents authorization-response confusion.", evidence: ["tests/attacks/oauth/state.test.ts", "tests/attacks/oauth/replay.test.ts"], observed: "When state validation is weakened, authorization-code exchange succeeds under mismatched state and the flow collapses structurally.", alignment: "Theory matches practice only when state is implemented correctly." },
        { assumption: "Redirect URI validation prevents code interception.", evidence: ["tests/attacks/oauth/redirect.test.ts"], observed: "Misconfigured redirect handling allows code delivery to an attacker-controlled endpoint.", alignment: "Empirical results strongly support the protocol assumption." },
    ],
    jwt: [
        { assumption: "Stateless tokens reduce coordination overhead while preserving authorization if claims and signatures are verified rigorously.", evidence: ["tests/attacks/jwt/audience-issuer-mismatch.test.ts", "docs/performance-results/analysis.md"], observed: "JWT remains performance-light, but weak audience or algorithm validation creates immediate authorization failures.", alignment: "The scaling assumption holds, but only under precise validation discipline." },
    ],
    sessions: [
        { assumption: "Cookie-backed sessions depend on browser constraints and revocation discipline to resist CSRF and replay.", evidence: ["tests/attacks/sessions/csrf.test.ts", "tests/attacks/auth.security.test.ts"], observed: "Session protection is robust when cookie flags and invalidation are correct, but browser-coupled mistakes expose fixation and replay paths quickly.", alignment: "Theory and empirical behavior align closely at the browser boundary." },
    ],
};
const PROPAGATION = {
    "oauth-redirect-misconfiguration": { affectedComponents: ["redirect URI allowlist", "authorization endpoint", "authorization code store", "token issuer"], affectedFlows: ["client redirect validation", "authorization code delivery", "token exchange"], affectedStrides: ["Spoofing", "Tampering", "Elevation of Privilege"], trustBoundaryCrossings: 4, secondaryFailures: ["authorization code interception", "token theft", "unauthorized token issuance"], propagationPattern: "non-linear", narrative: "A single redirect allowlist error crosses the browser-client boundary, redirects the code to an attacker endpoint, and then contaminates the token issuance stage." },
    "oauth-state-misconfiguration": { affectedComponents: ["state generator", "authorization response handler", "session binding", "token endpoint"], affectedFlows: ["state correlation", "authorization response binding", "token exchange"], affectedStrides: ["Tampering", "Spoofing"], trustBoundaryCrossings: 4, secondaryFailures: ["CSRF on auth response", "wrong-account binding", "session confusion"], propagationPattern: "non-linear", narrative: "State validation failure does not stop at one parameter check; it propagates into the user-session binding decision and can reassign downstream tokens to the wrong principal." },
    "oauth-scope-misconfiguration": { affectedComponents: ["client scope policy", "authorization endpoint", "token claims builder", "resource authorization"], affectedFlows: ["scope negotiation", "token minting", "resource access"], affectedStrides: ["Elevation of Privilege", "Tampering"], trustBoundaryCrossings: 4, secondaryFailures: ["over-privileged access token", "resource overreach"], propagationPattern: "fan-out", narrative: "A scope governance error fans out from client registration into token claims and then every protected resource that trusts those claims." },
    "jwt-audience-misconfiguration": { affectedComponents: ["audience validator", "issuer validator", "JWT middleware", "protected routes"], affectedFlows: ["token verification", "route authorization"], affectedStrides: ["Spoofing", "Elevation of Privilege"], trustBoundaryCrossings: 3, secondaryFailures: ["cross-service token reuse", "unauthorized API access"], propagationPattern: "linear", narrative: "Weak audience checks propagate almost directly from token verification into route acceptance, so the failure path is short but security-relevant." },
    "jwt-algorithm-misconfiguration": { affectedComponents: ["algorithm allowlist", "signature verifier", "JWT middleware", "protected routes"], affectedFlows: ["header parsing", "signature validation", "route authorization"], affectedStrides: ["Spoofing", "Tampering", "Elevation of Privilege"], trustBoundaryCrossings: 3, secondaryFailures: ["token forgery", "privilege escalation", "access-control bypass"], propagationPattern: "linear", narrative: "Algorithm confusion is a classic linear cascade: forged token, accepted signature, trusted route access, then authorization bypass." },
    "jwt-expiry-misconfiguration": { affectedComponents: ["token issuer", "expiry policy", "JWT middleware", "incident containment"], affectedFlows: ["token issuance", "replay window", "route authorization"], affectedStrides: ["Repudiation", "Spoofing"], trustBoundaryCrossings: 3, secondaryFailures: ["extended replay window", "delayed revocation effect"], propagationPattern: "linear", narrative: "Extended token lifetime enlarges the replay window and delays containment, so the propagation is temporal rather than branching." },
    "sessions-fixation-misconfiguration": { affectedComponents: ["session ID rotation", "session store", "login flow", "protected routes"], affectedFlows: ["pre-auth session setup", "login transition", "authenticated session reuse"], affectedStrides: ["Spoofing", "Elevation of Privilege"], trustBoundaryCrossings: 3, secondaryFailures: ["session hijack", "authenticated takeover"], propagationPattern: "fan-out", narrative: "A fixation bug turns the login transition itself into the propagation point, binding the victim identity to attacker-controlled state." },
    "sessions-cookie-flag-misconfiguration": { affectedComponents: ["cookie hardening", "browser storage", "session middleware", "protected routes"], affectedFlows: ["cookie issuance", "browser execution context", "session replay"], affectedStrides: ["Information Disclosure", "Spoofing"], trustBoundaryCrossings: 3, secondaryFailures: ["script-readable cookie", "session theft", "replay access"], propagationPattern: "fan-out", narrative: "Cookie hardening failures propagate outward because once a browser-side boundary is weakened, every subsequent session-bearing request inherits that weakness." },
    "sessions-logout-misconfiguration": { affectedComponents: ["logout invalidation", "session store", "protected routes", "session revocation logic"], affectedFlows: ["logout processing", "post-logout access", "cookie replay"], affectedStrides: ["Spoofing", "Repudiation"], trustBoundaryCrossings: 3, secondaryFailures: ["stolen cookie replay", "unauthorized persistence"], propagationPattern: "fan-out", narrative: "Failure to invalidate the server-side session after logout turns a single missed revocation event into a continuing authenticated replay path." },
};
const CFPA_WEIGHT_PROFILES = { default: { component: 0.25, flow: 0.25, stride: 0.2, secondary: 0.15, boundary: 0.15 }, equal: { component: 0.2, flow: 0.2, stride: 0.2, secondary: 0.2, boundary: 0.2 }, boundary_heavy: { component: 0.15, flow: 0.15, stride: 0.15, secondary: 0.15, boundary: 0.4 } };
const CLI_WEIGHT_PROFILES = { default: { configPoints: 1.2, securityFlags: 1.1, lifecycleSteps: 1.3, trustBoundaryCrossings: 1.0, validationRules: 1.2, mustRememberBehaviors: 1.4 }, lifecycle_heavy: { configPoints: 1.0, securityFlags: 1.0, lifecycleSteps: 1.8, trustBoundaryCrossings: 0.9, validationRules: 1.1, mustRememberBehaviors: 1.5 }, boundary_heavy: { configPoints: 1.0, securityFlags: 1.0, lifecycleSteps: 1.1, trustBoundaryCrossings: 1.8, validationRules: 1.1, mustRememberBehaviors: 1.5 } };
const WEB_WEIGHT_PROFILES = { default: { severity: 0.45, exploitability: 0.25, propagation: 0.3 }, severity_heavy: { severity: 0.6, exploitability: 0.2, propagation: 0.2 }, propagation_heavy: { severity: 0.3, exploitability: 0.2, propagation: 0.5 } };
const LIFECYCLE_LIKELIHOOD_WEIGHT_PROFILES = { default: { lifecycleSteps: 1.4, mustRememberBehaviors: 1.3, trustBoundaryCrossings: 1.2 }, lifecycle_heavy: { lifecycleSteps: 1.9, mustRememberBehaviors: 1.2, trustBoundaryCrossings: 1.0 }, boundary_heavy: { lifecycleSteps: 1.1, mustRememberBehaviors: 1.2, trustBoundaryCrossings: 1.9 } };
function parseCsvLine(line) { const out = []; let current = ""; let inQuotes = false; for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i += 1;
        }
        else {
            inQuotes = !inQuotes;
        }
        continue;
    }
    if (ch === "," && !inQuotes) {
        out.push(current);
        current = "";
        continue;
    }
    current += ch;
} out.push(current); return out; }
function readVariantSummaries() { return JSON.parse(fs_1.default.readFileSync(path_1.default.join(process.cwd(), report_paths_1.GENERATED_FILES.variantFocusedJson), "utf8")); }
function readCodeFootprint() { return JSON.parse(fs_1.default.readFileSync(path_1.default.join(process.cwd(), report_paths_1.GENERATED_FILES.codeFootprintJson), "utf8")); }
function readPerformanceSummary() { const rows = fs_1.default.readFileSync(path_1.default.join(process.cwd(), "docs", "performance-results", "statistical-summary.csv"), "utf8").trim().split(/\r?\n/).map(parseCsvLine); if (rows.length <= 1)
    return []; const index = new Map(); rows[0].forEach((value, idx) => index.set(value, idx)); const val = (row, key) => row[index.get(key) ?? -1] ?? ""; return rows.slice(1).map((row) => ({ model: val(row, "model"), avgDeltaPct: Number(val(row, "avg_delta_pct")), throughputDeltaPct: Number(val(row, "throughput_delta_pct")), ciLower: val(row, "ci95_avg_delta_pct_lower") === "" ? null : Number(val(row, "ci95_avg_delta_pct_lower")), ciUpper: val(row, "ci95_avg_delta_pct_upper") === "" ? null : Number(val(row, "ci95_avg_delta_pct_upper")), attackOutlierCount: Number(val(row, "attack_avg_outlier_count") || "0") })); }
function average(values) { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0; }
function format(value, digits = 2) { return Number.isFinite(value) ? value.toFixed(digits) : "n/a"; }
function titleCase(value) { return value.split("-").map((part) => part === "oauth" ? "OAuth" : part === "jwt" ? "JWT" : part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }
function writeJsonArtifact(relativePath, payload) { fs_1.default.writeFileSync(path_1.default.join(process.cwd(), relativePath), `${JSON.stringify(payload, null, 2)}\n`); }
function propagationScore(meta, weights = CFPA_WEIGHT_PROFILES.default) { return 10 * ((meta.affectedComponents.length / 4) * weights.component + (meta.affectedFlows.length / 3) * weights.flow + (meta.affectedStrides.length / 3) * weights.stride + (meta.secondaryFailures.length / 3) * weights.secondary + (meta.trustBoundaryCrossings / 4) * weights.boundary); }
function cognitiveLoadRaw(profile, weights = CLI_WEIGHT_PROFILES.default) { return profile.configPoints * weights.configPoints + profile.securityFlags * weights.securityFlags + profile.lifecycleSteps * weights.lifecycleSteps + profile.trustBoundaryCrossings * weights.trustBoundaryCrossings + profile.validationRules * weights.validationRules + profile.mustRememberBehaviors * weights.mustRememberBehaviors; }
function weightedExploitBurden(model, variants, weights = WEB_WEIGHT_PROFILES.default) { return average(variants.filter((variant) => variant.category === model).map((variant) => variant.severityScore * weights.severity + variant.exploitabilityScore10 * weights.exploitability + propagationScore(PROPAGATION[variant.variantName]) * weights.propagation)); }
function lifecycleErrorLikelihoodProxy(model, variants, weights = LIFECYCLE_LIKELIHOOD_WEIGHT_PROFILES.default) { const profile = MODEL_PROFILES[model]; const burden = profile.lifecycleSteps * weights.lifecycleSteps + profile.mustRememberBehaviors * weights.mustRememberBehaviors + profile.trustBoundaryCrossings * weights.trustBoundaryCrossings; return burden * (1 + weightedExploitBurden(model, variants) / 20); }
function rankOrder(scores) { return [...MODEL_ORDER].sort((left, right) => scores[right] - scores[left]).map((model) => MODEL_PROFILES[model].label).join(" > "); }
function normalizeTo100(scores) { const max = Math.max(...MODEL_ORDER.map((model) => scores[model])); return max === 0 ? { oauth: 0, jwt: 0, sessions: 0 } : { oauth: (scores.oauth / max) * 100, jwt: (scores.jwt / max) * 100, sessions: (scores.sessions / max) * 100 }; }
function dominantPatternForModel(model, variants) { const patterns = variants.filter((variant) => variant.category === model).map((variant) => PROPAGATION[variant.variantName].propagationPattern); const counts = new Map(); for (const pattern of patterns)
    counts.set(pattern, (counts.get(pattern) ?? 0) + 1); return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "mixed"; }
function cfpaSensitivityRows(variants) { return Object.entries(CFPA_WEIGHT_PROFILES).map(([profile, weights]) => { const scores = { oauth: average(variants.filter((variant) => variant.category === "oauth").map((variant) => propagationScore(PROPAGATION[variant.variantName], weights))), jwt: average(variants.filter((variant) => variant.category === "jwt").map((variant) => propagationScore(PROPAGATION[variant.variantName], weights))), sessions: average(variants.filter((variant) => variant.category === "sessions").map((variant) => propagationScore(PROPAGATION[variant.variantName], weights))) }; return { profile, scores, ranking: rankOrder(scores) }; }); }
function cliSensitivityRows() { return Object.entries(CLI_WEIGHT_PROFILES).map(([profile, weights]) => { const rawScores = { oauth: cognitiveLoadRaw(MODEL_PROFILES.oauth, weights), jwt: cognitiveLoadRaw(MODEL_PROFILES.jwt, weights), sessions: cognitiveLoadRaw(MODEL_PROFILES.sessions, weights) }; return { profile, rawScores, normalizedScores: normalizeTo100(rawScores), ranking: rankOrder(rawScores) }; }); }
function weightedExploitSensitivityRows(variants) { return Object.entries(WEB_WEIGHT_PROFILES).map(([profile, weights]) => { const scores = { oauth: weightedExploitBurden("oauth", variants, weights), jwt: weightedExploitBurden("jwt", variants, weights), sessions: weightedExploitBurden("sessions", variants, weights) }; return { profile, scores, ranking: rankOrder(scores) }; }); }
function lifecycleLikelihoodSensitivityRows(variants) { return Object.entries(LIFECYCLE_LIKELIHOOD_WEIGHT_PROFILES).map(([profile, weights]) => { const scores = { oauth: lifecycleErrorLikelihoodProxy("oauth", variants, weights), jwt: lifecycleErrorLikelihoodProxy("jwt", variants, weights), sessions: lifecycleErrorLikelihoodProxy("sessions", variants, weights) }; return { profile, scores, ranking: rankOrder(scores) }; }); }
function writeFailurePropagationAnalysis(variants) {
    const sensitivity = cfpaSensitivityRows(variants);
    const lines = [
        "# Failure Propagation Analysis",
        "",
        `Generated: ${new Date().toISOString()}`,
        "Regenerate: npm run analysis:structural",
        "",
        "This report models how each controlled authentication misconfiguration propagates beyond its initial defect point into downstream components, flows, and STRIDE consequences.",
        "",
        "## Formula",
        "",
        "$$",
        "CFPA = 10 \\times (0.25C + 0.25F + 0.20S + 0.15X + 0.15B)",
        "$$",
        "",
        "| Model | Mean Propagation Score (0-10) | Max Variant Score | Avg Components Touched | Avg Flows Touched | Avg STRIDE Breadth | Dominant Pattern |",
        "|---|---:|---:|---:|---:|---:|---|",
    ];
    for (const model of MODEL_ORDER) {
        const relevant = variants.filter((variant) => variant.category === model);
        const metas = relevant.map((variant) => PROPAGATION[variant.variantName]);
        const scores = metas.map((meta) => propagationScore(meta));
        lines.push(`| ${MODEL_PROFILES[model].label} | ${format(average(scores))} | ${format(Math.max(...scores))} | ${format(average(metas.map((meta) => meta.affectedComponents.length)))} | ${format(average(metas.map((meta) => meta.affectedFlows.length)))} | ${format(average(metas.map((meta) => meta.affectedStrides.length)))} | ${dominantPatternForModel(model, variants)} |`);
    }
    lines.push("", "## Sensitivity Analysis", "", "| Weight Profile | OAuth2 | JWT | Session | Rank Order |", "|---|---:|---:|---:|---|");
    for (const row of sensitivity)
        lines.push(`| ${row.profile} | ${format(row.scores.oauth)} | ${format(row.scores.jwt)} | ${format(row.scores.sessions)} | ${row.ranking} |`);
    lines.push("", "## Variant Detail", "", "| Variant | Model | Propagation Score | Components | Flows | STRIDE Breadth | Secondary Failures | Narrative |", "|---|---|---:|---|---|---|---|---|");
    for (const variant of variants) {
        const meta = PROPAGATION[variant.variantName];
        lines.push(`| ${titleCase(variant.variantName)} | ${MODEL_PROFILES[variant.category].label} | ${format(propagationScore(meta))} | ${meta.affectedComponents.join("<br>")} | ${meta.affectedFlows.join("<br>")} | ${meta.affectedStrides.join("<br>")} | ${meta.secondaryFailures.join("<br>")} | ${meta.narrative} |`);
    }
    fs_1.default.writeFileSync(path_1.default.join(process.cwd(), report_paths_1.GENERATED_FILES.failurePropagationAnalysis), `${lines.join("\n")}\n`);
    writeJsonArtifact(report_paths_1.GENERATED_FILES.failurePropagationAnalysisJson, { generatedAt: new Date().toISOString(), weightProfiles: CFPA_WEIGHT_PROFILES, sensitivity, claimClass: "exploratory-author-interpreted" });
}
function writeCognitiveLoadIndex() {
    const sensitivity = cliSensitivityRows();
    const maxRaw = Math.max(...MODEL_ORDER.map((model) => cognitiveLoadRaw(MODEL_PROFILES[model])));
    const lines = [
        "# Cognitive Load Index",
        "",
        `Generated: ${new Date().toISOString()}`,
        "Regenerate: npm run analysis:structural",
        "",
        "$$",
        "CLI = 1.2P + 1.1F + 1.3L + 1.0B + 1.2V + 1.4M",
        "$$",
        "",
        "| Model | Config Points | Security Flags | Lifecycle Steps | Trust Boundary Crossings | Validation Rules | Must-Remember Behaviors | Raw CLI | Normalized CLI (0-100) |",
        "|---|---:|---:|---:|---:|---:|---:|---:|---:|",
    ];
    for (const model of MODEL_ORDER) {
        const profile = MODEL_PROFILES[model];
        const raw = cognitiveLoadRaw(profile);
        lines.push(`| ${profile.label} | ${profile.configPoints} | ${profile.securityFlags} | ${profile.lifecycleSteps} | ${profile.trustBoundaryCrossings} | ${profile.validationRules} | ${profile.mustRememberBehaviors} | ${format(raw)} | ${format((raw / maxRaw) * 100)} |`);
    }
    lines.push("", "## Sensitivity Analysis", "", "| Weight Profile | OAuth2 | JWT | Session | Rank Order |", "|---|---:|---:|---:|---|");
    for (const row of sensitivity)
        lines.push(`| ${row.profile} | ${format(row.normalizedScores.oauth)} | ${format(row.normalizedScores.jwt)} | ${format(row.normalizedScores.sessions)} | ${row.ranking} |`);
    fs_1.default.writeFileSync(path_1.default.join(process.cwd(), report_paths_1.GENERATED_FILES.cognitiveLoadIndex), `${lines.join("\n")}\n`);
    writeJsonArtifact(report_paths_1.GENERATED_FILES.cognitiveLoadIndexJson, { generatedAt: new Date().toISOString(), weightProfiles: CLI_WEIGHT_PROFILES, sensitivity, claimClass: "exploratory-author-interpreted" });
}
function writeCrossReferenceSynthesis(variants) {
    const perf = readPerformanceSummary();
    const footprint = readCodeFootprint();
    const weightedBurdenSensitivity = weightedExploitSensitivityRows(variants);
    const lifecycleSensitivity = lifecycleLikelihoodSensitivityRows(variants);
    const baselineMap = new Map();
    for (const metric of footprint.baselineMetrics) {
        if (metric.label.startsWith("OAUTH"))
            baselineMap.set("oauth", metric);
        if (metric.label.startsWith("JWT"))
            baselineMap.set("jwt", metric);
        if (metric.label.startsWith("SESSIONS"))
            baselineMap.set("sessions", metric);
    }
    const lines = [
        "# Cross-Reference Synthesis",
        "",
        `Generated: ${new Date().toISOString()}`,
        "Regenerate: npm run analysis:structural",
        "",
        "- Weighted Exploit Burden (WEB) uses $0.45 \\times severity + 0.25 \\times exploitability + 0.30 \\times propagation$.",
        "- Lifecycle Error Likelihood Proxy (LELP) uses $(1.4 \\times lifecycleSteps + 1.3 \\times mustRemember + 1.2 \\times boundaryCrossings) \\times (1 + WEB/20)$.",
        "",
        "## 1) STRIDE vs Misconfiguration Variants",
        "",
        "| Variant | Model | STRIDE Classes | Propagation Pattern | Propagation Score | Structural Reading |",
        "|---|---|---|---|---:|---|",
    ];
    for (const variant of variants) {
        const meta = PROPAGATION[variant.variantName];
        lines.push(`| ${titleCase(variant.variantName)} | ${MODEL_PROFILES[variant.category].label} | ${meta.affectedStrides.join("<br>")} | ${meta.propagationPattern} | ${format(propagationScore(meta))} | ${meta.narrative} |`);
    }
    lines.push("", "## 2) Trust Boundaries vs Attack Evidence", "", "| Model | Primary Boundary | Attack Evidence | Structural Failure | Boundary-Centric Reading |", "|---|---|---|---|---|");
    for (const model of MODEL_ORDER) {
        const meta = BOUNDARY_ANALYSIS[model];
        lines.push(`| ${MODEL_PROFILES[model].label} | ${meta.primaryBoundary} | ${meta.attackEvidence.join("<br>")} | ${meta.structuralFailure} | ${meta.reading} |`);
    }
    lines.push("", "## 3) Performance Overhead vs Security Resilience", "", "| Model | Avg Latency Delta % | Throughput Delta % | Weighted Exploit Burden | Pareto Reading |", "|---|---:|---:|---:|---|");
    for (const model of MODEL_ORDER) {
        const perfRow = perf.find((row) => row.model === model);
        const burden = weightedExploitBurden(model, variants);
        const reading = model === "oauth" ? "Highest boundary complexity with modest measured latency overhead, indicating structural burden is not captured by latency alone." : model === "jwt" ? "Fastest execution profile, but high validation fragility means small mistakes remain costly." : "Lower measured attack latency overhead does not imply lower structural risk; browser-coupled failures still propagate sharply.";
        lines.push(`| ${MODEL_PROFILES[model].label} | ${format(perfRow?.avgDeltaPct ?? Number.NaN)} | ${format(perfRow?.throughputDeltaPct ?? Number.NaN)} | ${format(burden)} | ${reading} |`);
    }
    lines.push("", "## 4) Lifecycle Complexity vs Developer Error Likelihood", "", "| Model | Lifecycle Steps | Must-Remember Behaviors | Controlled Variant Count | Error Likelihood Proxy | Interpretation |", "|---|---:|---:|---:|---:|---|");
    for (const model of MODEL_ORDER) {
        const profile = MODEL_PROFILES[model];
        const count = variants.filter((variant) => variant.category === model).length;
        const proxy = lifecycleErrorLikelihoodProxy(model, variants);
        const interpretation = model === "oauth" ? "Most sequence-heavy model; controlled variant count is fixed, so the proxy reflects burden per step rather than raw frequency." : model === "jwt" ? "Fewer steps than OAuth2, but each validation slip has higher precision sensitivity." : "Simple lifecycle, but browser defaults keep the hidden-error burden meaningful.";
        lines.push(`| ${profile.label} | ${profile.lifecycleSteps} | ${profile.mustRememberBehaviors} | ${count} | ${format(proxy)} | ${interpretation} |`);
    }
    lines.push("", "## 5) Protocol Assumptions vs Real Attack Behaviour", "", "| Model | Protocol Assumption | Empirical Evidence | Observed Behaviour | Alignment |", "|---|---|---|---|---|");
    for (const model of MODEL_ORDER)
        for (const item of PROTOCOL_EXPECTATIONS[model])
            lines.push(`| ${MODEL_PROFILES[model].label} | ${item.assumption} | ${item.evidence.join("<br>")} | ${item.observed} | ${item.alignment} |`);
    lines.push("", "## 6) Attack Surface vs Code Footprint", "", "| Model | Characters | Lines | Cyclomatic Complexity | Mean Propagation Score | Reading |", "|---|---:|---:|---:|---:|---|");
    for (const model of MODEL_ORDER) {
        const metric = baselineMap.get(model);
        const meanPropagation = average(variants.filter((variant) => variant.category === model).map((variant) => propagationScore(PROPAGATION[variant.variantName])));
        const reading = model === "oauth" ? "Largest baseline footprint also coincides with the broadest propagation surface." : model === "jwt" ? "Smaller footprint does not guarantee safety; the slice is compact but high-impact when validation is weak." : "Moderate footprint aligns with a narrower surface, but browser-linked failures remain operationally sharp.";
        lines.push(`| ${MODEL_PROFILES[model].label} | ${metric?.characters ?? 0} | ${metric?.lines ?? 0} | ${metric?.cyclomaticComplexity ?? 0} | ${format(meanPropagation)} | ${reading} |`);
    }
    lines.push("", "## 7) Misconfiguration Propagation vs Performance Jitter", "", "| Model | Mean Propagation Score | Attack Avg Outliers | 95% CI Width for Avg Delta % | Interpretation |", "|---|---:|---:|---:|---|");
    for (const model of MODEL_ORDER) {
        const meanPropagation = average(variants.filter((variant) => variant.category === model).map((variant) => propagationScore(PROPAGATION[variant.variantName])));
        const perfRow = perf.find((row) => row.model === model);
        const ciWidth = perfRow && perfRow.ciLower !== null && perfRow.ciUpper !== null ? perfRow.ciUpper - perfRow.ciLower : Number.NaN;
        const interpretation = (perfRow?.attackOutlierCount ?? 0) > 0 ? "Propagation-heavy weaknesses coincide with measurable repeated-run instability and should be interpreted conservatively." : "No repeated-run attack outliers flagged; structural risk here is driven more by exploitability than jitter.";
        lines.push(`| ${MODEL_PROFILES[model].label} | ${format(meanPropagation)} | ${perfRow?.attackOutlierCount ?? 0} | ${format(ciWidth)} | ${interpretation} |`);
    }
    lines.push("", "## Sensitivity Analysis", "", "### Weighted Exploit Burden Sensitivity", "", "| Weight Profile | OAuth2 | JWT | Session | Rank Order |", "|---|---:|---:|---:|---|");
    for (const row of weightedBurdenSensitivity)
        lines.push(`| ${row.profile} | ${format(row.scores.oauth)} | ${format(row.scores.jwt)} | ${format(row.scores.sessions)} | ${row.ranking} |`);
    lines.push("", "### Lifecycle Error Likelihood Sensitivity", "", "| Weight Profile | OAuth2 | JWT | Session | Rank Order |", "|---|---:|---:|---:|---|");
    for (const row of lifecycleSensitivity)
        lines.push(`| ${row.profile} | ${format(row.scores.oauth)} | ${format(row.scores.jwt)} | ${format(row.scores.sessions)} | ${row.ranking} |`);
    fs_1.default.writeFileSync(path_1.default.join(process.cwd(), report_paths_1.GENERATED_FILES.crossReferenceSynthesis), `${lines.join("\n")}\n`);
    writeJsonArtifact(report_paths_1.GENERATED_FILES.crossReferenceSynthesisJson, { generatedAt: new Date().toISOString(), weightProfiles: { weightedExploitBurden: WEB_WEIGHT_PROFILES, lifecycleErrorLikelihood: LIFECYCLE_LIKELIHOOD_WEIGHT_PROFILES }, sensitivity: { weightedExploitBurden: weightedBurdenSensitivity, lifecycleErrorLikelihood: lifecycleSensitivity }, claimClass: "exploratory-author-interpreted" });
}
function main() {
    const variants = readVariantSummaries();
    writeFailurePropagationAnalysis(variants);
    writeCognitiveLoadIndex();
    writeCrossReferenceSynthesis(variants);
}
main();

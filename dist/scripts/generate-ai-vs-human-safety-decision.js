"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
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
function readJson(relativePath) {
    const fullPath = path_1.default.join(process.cwd(), relativePath);
    return JSON.parse(fs_1.default.readFileSync(fullPath, "utf8"));
}
function readAiCsv(relativePath) {
    const fullPath = path_1.default.join(process.cwd(), relativePath);
    const text = fs_1.default.readFileSync(fullPath, "utf8").trim();
    if (!text)
        return [];
    const rows = text.split(/\r?\n/).map(parseCsvLine);
    const header = rows[0];
    const modelIndex = header.indexOf("model");
    const passedIndex = header.indexOf("passed");
    return rows.slice(1).map((row) => ({
        model: row[modelIndex],
        passed: String(row[passedIndex]).toLowerCase() === "true",
    }));
}
function pct(num, den) {
    if (den <= 0)
        return 0;
    return (num / den) * 100;
}
function fmt(n, digits = 3) {
    return Number.isFinite(n) ? n.toFixed(digits) : "0.000";
}
function main() {
    const normalized = readJson("docs/generated/normalized-failure-density.json");
    const control = readJson("docs/generated/security-control-points.json");
    const aiRows = readAiCsv("ai-generated/results/ai-samples-summary.csv");
    const models = ["oauth", "jwt", "sessions"];
    const modelNames = {
        oauth: "OAuth2",
        jwt: "JWT",
        sessions: "Session",
    };
    const lines = [];
    const generatedAt = new Date().toISOString();
    lines.push("# AI vs Human Safety Decision Brief");
    lines.push("");
    lines.push(`Generated: ${generatedAt}`);
    lines.push("Regenerate: npm run decision:ai-vs-human");
    lines.push("");
    lines.push("## Decision Signal");
    lines.push("");
    let aiWorseCount = 0;
    for (const model of models) {
        const baseline = normalized.rows.find((row) => row.model === model && row.source === "baseline");
        const ai = normalized.rows.find((row) => row.model === model && row.source === "ai");
        if ((ai?.failuresPer10kChars ?? 0) > (baseline?.failuresPer10kChars ?? 0)) {
            aiWorseCount += 1;
        }
    }
    const verdict = aiWorseCount === models.length
        ? "In this dataset, human-authored baseline implementations are safer than AI-generated samples."
        : "In this dataset, the safety ordering is mixed and needs model-by-model interpretation.";
    lines.push(`- ${verdict}`);
    lines.push("- This is an empirical conclusion for this repository and protocol, not a universal rule about all teams or models.");
    lines.push("");
    lines.push("## Model Comparison");
    lines.push("");
    lines.push("| Model | Human Baseline Failures per 10k Chars | AI Failures per 10k Chars | Delta (AI - Human) | AI Sample Failure Rate | Human Baseline Failure Events | AI Failure Events |");
    lines.push("|---|---:|---:|---:|---:|---:|---:|");
    for (const model of models) {
        const baseline = normalized.rows.find((row) => row.model === model && row.source === "baseline");
        const ai = normalized.rows.find((row) => row.model === model && row.source === "ai");
        const modelAiRows = aiRows.filter((row) => row.model === model);
        const aiFails = modelAiRows.filter((row) => !row.passed).length;
        const aiFailRate = pct(aiFails, modelAiRows.length);
        const baselineDensity = baseline?.failuresPer10kChars ?? 0;
        const aiDensity = ai?.failuresPer10kChars ?? 0;
        lines.push(`| ${modelNames[model]} | ${fmt(baselineDensity)} | ${fmt(aiDensity)} | ${fmt(aiDensity - baselineDensity)} | ${fmt(aiFailRate, 1)}% | ${baseline?.failureEvents ?? 0} | ${ai?.failureEvents ?? 0} |`);
    }
    lines.push("");
    lines.push("## Security-Critical Control Pressure");
    lines.push("");
    lines.push("| Model | Human Baseline Risk per 10k Chars | AI Risk per 10k Chars | Delta (AI - Human) | Human Baseline Control Events | AI Control Events |");
    lines.push("|---|---:|---:|---:|---:|---:|");
    for (const model of models) {
        const baseline = control.modelSummary.find((row) => row.model === model && row.source === "baseline");
        const ai = control.modelSummary.find((row) => row.model === model && row.source === "ai");
        const baselineRisk = baseline?.avgRiskPer10kChars ?? 0;
        const aiRisk = ai?.avgRiskPer10kChars ?? 0;
        lines.push(`| ${modelNames[model]} | ${fmt(baselineRisk)} | ${fmt(aiRisk)} | ${fmt(aiRisk - baselineRisk)} | ${baseline?.failureEventsTotal ?? 0} | ${ai?.failureEventsTotal ?? 0} |`);
    }
    lines.push("");
    lines.push("## How to Interpret Safely");
    lines.push("");
    lines.push("- Human baseline is the safer default in this controlled comparison.");
    lines.push("- AI generation can still be used, but with mandatory hardening review gates and attack-focused tests.");
    lines.push("- Treat AI output as draft code requiring adversarial validation, not production-ready authentication logic.");
    lines.push("");
    lines.push("## Scope and Limits");
    lines.push("");
    lines.push("- Baseline rows represent curated human-authored references in this repository.");
    lines.push("- AI rows represent sampled outputs under the tested prompts, providers, and evaluation harness.");
    lines.push("- This brief is decision support, not a claim about all possible AI or human coding workflows.");
    const outputPath = path_1.default.join(process.cwd(), "docs/generated/AI_VS_HUMAN_SAFETY_DECISION.md");
    fs_1.default.writeFileSync(outputPath, `${lines.join("\n")}\n`);
    console.log("Wrote docs/generated/AI_VS_HUMAN_SAFETY_DECISION.md");
}
main();

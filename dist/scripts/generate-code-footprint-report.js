"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const typescript_1 = __importDefault(require("typescript"));
const report_paths_1 = require("./report-paths");
const escomplex = require("escomplex");
function shouldTolerateParseErrors() {
    return (["1", "true", "yes"].includes((process.env.AI_FOOTPRINT_TOLERATE_PARSE_ERRORS ?? "").toLowerCase()) ||
        process.argv.includes("--tolerate-parse-errors"));
}
const baselineScopes = {
    oauth: [
        "src/oauth/oauth.controller.ts",
        "src/oauth/oauth.service.ts",
        "src/oauth/oauth.middleware.ts",
        "src/oauth/oauth.routes.ts",
        "src/oauth/rateLimit.ts",
        "src/oauth/clientScopes.ts",
    ],
    jwt: [
        "src/jwt/jwt.controller.ts",
        "src/jwt/jwt.middleware.ts",
        "src/jwt/jwt.routes.ts",
        "src/jwt/jwt.service.ts",
    ],
    sessions: [
        "src/sessions/sessions.controller.ts",
        "src/sessions/sessions.middleware.ts",
        "src/sessions/sessions.routes.ts",
        "src/sessions/session.service.ts",
    ],
};
const variantScopes = {
    "oauth-redirect-misconfiguration": [
        ...baselineScopes.oauth,
        "misconfigurations/apply-override.ts",
        "src/variant-overrides.ts",
        "misconfigurations/oauth/redirect-misconfiguration/redirect.config.ts",
        "misconfigurations/oauth/redirect-misconfiguration/app.variant.ts",
    ],
    "oauth-state-misconfiguration": [
        ...baselineScopes.oauth,
        "misconfigurations/apply-override.ts",
        "src/variant-overrides.ts",
        "misconfigurations/oauth/state-misconfiguration/state.config.ts",
        "misconfigurations/oauth/state-misconfiguration/app.variant.ts",
    ],
    "oauth-scope-misconfiguration": [
        ...baselineScopes.oauth,
        "misconfigurations/apply-override.ts",
        "src/variant-overrides.ts",
        "misconfigurations/oauth/scope-misconfiguration/scope.config.ts",
        "misconfigurations/oauth/scope-misconfiguration/app.variant.ts",
    ],
    "jwt-audience-misconfiguration": [
        ...baselineScopes.jwt,
        "misconfigurations/apply-override.ts",
        "src/variant-overrides.ts",
        "misconfigurations/jwt/audience-misconfiguration/audience.config.ts",
        "misconfigurations/jwt/audience-misconfiguration/app.variant.ts",
    ],
    "jwt-algorithm-misconfiguration": [
        ...baselineScopes.jwt,
        "misconfigurations/apply-override.ts",
        "src/variant-overrides.ts",
        "misconfigurations/jwt/algorithm-misconfiguration/algorithm.config.ts",
        "misconfigurations/jwt/algorithm-misconfiguration/app.variant.ts",
    ],
    "jwt-expiry-misconfiguration": [
        ...baselineScopes.jwt,
        "misconfigurations/apply-override.ts",
        "src/variant-overrides.ts",
        "misconfigurations/jwt/expiry-misconfiguration/expiry.config.ts",
        "misconfigurations/jwt/expiry-misconfiguration/app.variant.ts",
    ],
    "sessions-fixation-misconfiguration": [
        ...baselineScopes.sessions,
        "misconfigurations/apply-override.ts",
        "src/variant-overrides.ts",
        "misconfigurations/sessions/fixation-misconfiguration/fixation.config.ts",
        "misconfigurations/sessions/fixation-misconfiguration/app.variant.ts",
    ],
    "sessions-cookie-flag-misconfiguration": [
        ...baselineScopes.sessions,
        "misconfigurations/apply-override.ts",
        "src/variant-overrides.ts",
        "misconfigurations/sessions/cookie-flag-misconfiguration/cookie-flag.config.ts",
        "misconfigurations/sessions/cookie-flag-misconfiguration/app.variant.ts",
    ],
    "sessions-logout-misconfiguration": [
        ...baselineScopes.sessions,
        "misconfigurations/apply-override.ts",
        "src/variant-overrides.ts",
        "misconfigurations/sessions/logout-misconfiguration/logout.config.ts",
        "misconfigurations/sessions/logout-misconfiguration/app.variant.ts",
    ],
};
const aiScopes = {
    oauth: "ai-generated/oauth",
    jwt: "ai-generated/jwt",
    sessions: "ai-generated/sessions",
};
function listAiSampleFiles(model) {
    const relativeDir = aiScopes[model];
    const absoluteDir = path_1.default.join(process.cwd(), relativeDir);
    if (!fs_1.default.existsSync(absoluteDir))
        return [];
    return fs_1.default
        .readdirSync(absoluteDir)
        .filter((name) => /^sample\d+\.ts$/i.test(name))
        .sort((a, b) => {
        const aNum = Number(a.match(/\d+/)?.[0] ?? 0);
        const bNum = Number(b.match(/\d+/)?.[0] ?? 0);
        return aNum - bNum;
    })
        .map((name) => path_1.default.join(relativeDir, name).replace(/\\/g, "/"));
}
function readFileMetric(relativePath, tolerateParseErrors) {
    const filePath = path_1.default.join(process.cwd(), relativePath);
    const sourceText = fs_1.default.readFileSync(filePath, "utf8");
    const sourceFile = typescript_1.default.createSourceFile(relativePath, sourceText, typescript_1.default.ScriptTarget.Latest, true, typescript_1.default.ScriptKind.TS);
    let functions = 0;
    let classes = 0;
    let constants = 0;
    function visit(node) {
        if (typescript_1.default.isFunctionDeclaration(node) ||
            typescript_1.default.isFunctionExpression(node) ||
            typescript_1.default.isArrowFunction(node) ||
            typescript_1.default.isMethodDeclaration(node)) {
            functions += 1;
        }
        if (typescript_1.default.isClassDeclaration(node)) {
            classes += 1;
        }
        if (typescript_1.default.isVariableDeclarationList(node) && (node.flags & typescript_1.default.NodeFlags.Const) !== 0) {
            constants += node.declarations.length;
        }
        typescript_1.default.forEachChild(node, visit);
    }
    visit(sourceFile);
    const transpiled = typescript_1.default.transpileModule(sourceText, {
        compilerOptions: {
            module: typescript_1.default.ModuleKind.CommonJS,
            target: typescript_1.default.ScriptTarget.ES5,
        },
    }).outputText;
    let complexity;
    try {
        complexity = escomplex.analyse(transpiled);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!tolerateParseErrors) {
            throw new Error(`Failed complexity analysis for ${relativePath}: ${message}`);
        }
        return {
            metric: {
                filePath: relativePath,
                characters: sourceText.length,
                lines: sourceText.split(/\r?\n/).length,
                functions,
                classes,
                constants,
                cyclomaticComplexity: Number.NaN,
                maintainabilityIndex: Number.NaN,
            },
            parseError: message,
        };
    }
    return {
        metric: {
            filePath: relativePath,
            characters: sourceText.length,
            lines: sourceText.split(/\r?\n/).length,
            functions,
            classes,
            constants,
            cyclomaticComplexity: complexity.aggregate.cyclomatic,
            maintainabilityIndex: complexity.maintainability,
        },
    };
}
function aggregateMetrics(label, scope, files) {
    const tolerateParseErrors = shouldTolerateParseErrors();
    const results = files.map((filePath) => readFileMetric(filePath, tolerateParseErrors));
    const fileMetrics = results.map((result) => result.metric);
    const parseErrorFiles = results
        .filter((result) => typeof result.parseError === "string")
        .map((result) => ({ filePath: result.metric.filePath, error: result.parseError }));
    const maintainabilityValues = fileMetrics
        .map((item) => item.maintainabilityIndex)
        .filter((value) => Number.isFinite(value));
    const maintainabilityIndexAverage = maintainabilityValues.length > 0
        ? maintainabilityValues.reduce((sum, value) => sum + value, 0) / maintainabilityValues.length
        : Number.NaN;
    const cyclomaticComplexity = fileMetrics
        .map((item) => item.cyclomaticComplexity)
        .filter((value) => Number.isFinite(value))
        .reduce((sum, value) => sum + value, 0);
    return {
        label,
        scope,
        fileCount: fileMetrics.length,
        characters: fileMetrics.reduce((sum, item) => sum + item.characters, 0),
        lines: fileMetrics.reduce((sum, item) => sum + item.lines, 0),
        functions: fileMetrics.reduce((sum, item) => sum + item.functions, 0),
        classes: fileMetrics.reduce((sum, item) => sum + item.classes, 0),
        constants: fileMetrics.reduce((sum, item) => sum + item.constants, 0),
        cyclomaticComplexity,
        maintainabilityIndexAverage,
        complexityParseFailures: parseErrorFiles.length,
        parseErrorFiles,
        files: fileMetrics,
    };
}
function aggregateAiAverages(model) {
    const aiSampleFiles = listAiSampleFiles(model);
    const metric = aggregateMetrics(`${model.toUpperCase()} AI Samples`, "ai-generated", aiSampleFiles);
    return {
        ...metric,
        label: `${model.toUpperCase()} AI Samples (Aggregate)`,
    };
}
function buildAllMetrics() {
    const baselineMetrics = Object.entries(baselineScopes).map(([model, files]) => aggregateMetrics(`${model.toUpperCase()} Baseline`, "baseline", files));
    const variantMetrics = Object.entries(variantScopes).map(([variantName, files]) => aggregateMetrics(variantName, "misconfiguration", files));
    const aiMetrics = Object.keys(aiScopes).map((model) => aggregateAiAverages(model));
    return { baselineMetrics, variantMetrics, aiMetrics };
}
function writeJson(allMetrics) {
    fs_1.default.writeFileSync(path_1.default.join(process.cwd(), report_paths_1.GENERATED_FILES.codeFootprintJson), JSON.stringify(allMetrics, null, 2));
}
function writeMarkdown(allMetrics, tolerateParseErrors) {
    const allParseFailures = [...allMetrics.baselineMetrics, ...allMetrics.variantMetrics, ...allMetrics.aiMetrics]
        .flatMap((metric) => metric.parseErrorFiles.map((entry) => ({ label: metric.label, ...entry })));
    const generatedAt = new Date().toISOString();
    const lines = [];
    lines.push("# Code Footprint Summary");
    lines.push("");
    lines.push(`Generated: ${generatedAt}`);
    lines.push(`Regenerate: npm run ${tolerateParseErrors ? "code:footprint:tolerant" : "code:footprint"}`);
    lines.push("");
    lines.push("## Scope Rules");
    lines.push("");
    lines.push("- Baseline counts cover only model-owned implementation files under `src/<model>`.");
    lines.push("- Shared infrastructure such as `src/db.ts`, Prisma schema/migrations, server bootstrap, tests, and Postman collections is intentionally excluded.");
    lines.push("- Misconfiguration counts are measured as the baseline slice plus the active override files (`app.variant.ts`, `*.config.ts`, and shared override plumbing).");
    lines.push("- AI-generated counts cover the standalone contents of each `sampleX.ts` file only.");
    lines.push("- This means baseline and variant counts are runtime-slice counts, not whole-repository counts.");
    lines.push("");
    lines.push("## Baseline Footprints");
    lines.push("");
    lines.push("| Slice | Files | Chars | Lines | Functions | Classes | Constants | Cyclomatic | Avg Maintainability |");
    lines.push("|---|---:|---:|---:|---:|---:|---:|---:|---:|");
    for (const metric of allMetrics.baselineMetrics) {
        lines.push(`| ${metric.label} | ${metric.fileCount} | ${metric.characters} | ${metric.lines} | ${metric.functions} | ${metric.classes} | ${metric.constants} | ${metric.cyclomaticComplexity} | ${metric.maintainabilityIndexAverage.toFixed(2)} |`);
    }
    lines.push("");
    lines.push("## Misconfiguration Effective Footprints");
    lines.push("");
    lines.push("| Variant | Files | Chars | Lines | Functions | Classes | Constants | Cyclomatic | Avg Maintainability |");
    lines.push("|---|---:|---:|---:|---:|---:|---:|---:|---:|");
    for (const metric of allMetrics.variantMetrics) {
        lines.push(`| ${metric.label} | ${metric.fileCount} | ${metric.characters} | ${metric.lines} | ${metric.functions} | ${metric.classes} | ${metric.constants} | ${metric.cyclomaticComplexity} | ${metric.maintainabilityIndexAverage.toFixed(2)} |`);
    }
    lines.push("");
    lines.push("## AI-Generated Footprints");
    lines.push("");
    lines.push("| Model | Files | Chars | Lines | Functions | Classes | Constants | Cyclomatic | Avg Maintainability |");
    lines.push("|---|---:|---:|---:|---:|---:|---:|---:|---:|");
    for (const metric of allMetrics.aiMetrics) {
        lines.push(`| ${metric.label} | ${metric.fileCount} | ${metric.characters} | ${metric.lines} | ${metric.functions} | ${metric.classes} | ${metric.constants} | ${metric.cyclomaticComplexity} | ${metric.maintainabilityIndexAverage.toFixed(2)} |`);
    }
    lines.push("");
    lines.push("## Complexity Parse Failures");
    lines.push("");
    if (allParseFailures.length === 0) {
        lines.push("None.");
    }
    else {
        lines.push("| Scope | File | Error |");
        lines.push("|---|---|---|");
        for (const failure of allParseFailures) {
            lines.push(`| ${failure.label} | ${failure.filePath} | ${failure.error.replace(/\|/g, "\\|")} |`);
        }
    }
    fs_1.default.writeFileSync(path_1.default.join(process.cwd(), report_paths_1.GENERATED_FILES.codeFootprintSummary), `${lines.join("\n")}\n`);
}
function main() {
    const allMetrics = buildAllMetrics();
    writeJson(allMetrics);
    writeMarkdown(allMetrics, shouldTolerateParseErrors());
    console.log(`Wrote ${report_paths_1.GENERATED_FILES.codeFootprintSummary}`);
    console.log(`Wrote ${report_paths_1.GENERATED_FILES.codeFootprintJson}`);
}
main();

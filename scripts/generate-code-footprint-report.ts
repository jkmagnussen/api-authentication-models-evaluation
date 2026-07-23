import fs from "fs";
import path from "path";
import ts from "typescript";
import { GENERATED_FILES } from "./report-paths";

const escomplex = require("escomplex");

type FileMetric = {
  filePath: string;
  characters: number;
  lines: number;
  functions: number;
  classes: number;
  constants: number;
  cyclomaticComplexity: number;
  maintainabilityIndex: number;
};

type FileMetricResult = {
  metric: FileMetric;
  parseError?: string;
};

type AggregateMetric = {
  label: string;
  scope: string;
  fileCount: number;
  characters: number;
  lines: number;
  functions: number;
  classes: number;
  constants: number;
  cyclomaticComplexity: number;
  maintainabilityIndexAverage: number;
  complexityParseFailures: number;
  parseErrorFiles: Array<{ filePath: string; error: string }>;
  files: FileMetric[];
};

function shouldTolerateParseErrors(): boolean {
  return (
    ["1", "true", "yes"].includes((process.env.AI_FOOTPRINT_TOLERATE_PARSE_ERRORS ?? "").toLowerCase()) ||
    process.argv.includes("--tolerate-parse-errors")
  );
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
} as const;

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
} as const;

const aiScopes = {
  oauth: "ai-generated/oauth",
  jwt: "ai-generated/jwt",
  sessions: "ai-generated/sessions",
} as const;

function listAiSampleFiles(model: keyof typeof aiScopes): string[] {
  const relativeDir = aiScopes[model];
  const absoluteDir = path.join(process.cwd(), relativeDir);

  if (!fs.existsSync(absoluteDir)) return [];

  return fs
    .readdirSync(absoluteDir)
    .filter((name) => /^sample\d+\.ts$/i.test(name))
    .sort((a, b) => {
      const aNum = Number(a.match(/\d+/)?.[0] ?? 0);
      const bNum = Number(b.match(/\d+/)?.[0] ?? 0);
      return aNum - bNum;
    })
    .map((name) => path.join(relativeDir, name).replace(/\\/g, "/"));
}

function readFileMetric(relativePath: string, tolerateParseErrors: boolean): FileMetricResult {
  const filePath = path.join(process.cwd(), relativePath);
  const sourceText = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(relativePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

  let functions = 0;
  let classes = 0;
  let constants = 0;

  function visit(node: ts.Node) {
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isMethodDeclaration(node)
    ) {
      functions += 1;
    }

    if (ts.isClassDeclaration(node)) {
      classes += 1;
    }

    if (ts.isVariableDeclarationList(node) && (node.flags & ts.NodeFlags.Const) !== 0) {
      constants += node.declarations.length;
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  const transpiled = ts.transpileModule(sourceText, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES5,
    },
  }).outputText;

  let complexity;
  try {
    complexity = escomplex.analyse(transpiled);
  } catch (error) {
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

function aggregateMetrics(label: string, scope: string, files: readonly string[]): AggregateMetric {
  const tolerateParseErrors = shouldTolerateParseErrors();
  const results = files.map((filePath) => readFileMetric(filePath, tolerateParseErrors));
  const fileMetrics = results.map((result) => result.metric);
  const parseErrorFiles = results
    .filter((result): result is FileMetricResult & { parseError: string } => typeof result.parseError === "string")
    .map((result) => ({ filePath: result.metric.filePath, error: result.parseError }));
  const maintainabilityValues = fileMetrics
    .map((item) => item.maintainabilityIndex)
    .filter((value) => Number.isFinite(value));
  const maintainabilityIndexAverage =
    maintainabilityValues.length > 0
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

function aggregateAiAverages(model: keyof typeof aiScopes): AggregateMetric {
  const aiSampleFiles = listAiSampleFiles(model);
  const metric = aggregateMetrics(`${model.toUpperCase()} AI Samples`, "ai-generated", aiSampleFiles);

  return {
    ...metric,
    label: `${model.toUpperCase()} AI Samples (Aggregate)` ,
  };
}

function buildAllMetrics() {
  const baselineMetrics = Object.entries(baselineScopes).map(([model, files]) =>
    aggregateMetrics(`${model.toUpperCase()} Baseline`, "baseline", files)
  );

  const variantMetrics = Object.entries(variantScopes).map(([variantName, files]) =>
    aggregateMetrics(variantName, "misconfiguration", files)
  );

  const aiMetrics = Object.keys(aiScopes).map((model) =>
    aggregateAiAverages(model as keyof typeof aiScopes)
  );

  return { baselineMetrics, variantMetrics, aiMetrics };
}

function writeJson(allMetrics: ReturnType<typeof buildAllMetrics>) {
  fs.writeFileSync(
    path.join(process.cwd(), GENERATED_FILES.codeFootprintJson),
    JSON.stringify(allMetrics, null, 2)
  );
}

function writeMarkdown(allMetrics: ReturnType<typeof buildAllMetrics>, tolerateParseErrors: boolean) {
  const allParseFailures = [...allMetrics.baselineMetrics, ...allMetrics.variantMetrics, ...allMetrics.aiMetrics]
    .flatMap((metric) => metric.parseErrorFiles.map((entry) => ({ label: metric.label, ...entry })));

  const generatedAt = new Date().toISOString();
  const lines: string[] = [];
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
  } else {
    lines.push("| Scope | File | Error |");
    lines.push("|---|---|---|");
    for (const failure of allParseFailures) {
      lines.push(`| ${failure.label} | ${failure.filePath} | ${failure.error.replace(/\|/g, "\\|")} |`);
    }
  }

  fs.writeFileSync(path.join(process.cwd(), GENERATED_FILES.codeFootprintSummary), `${lines.join("\n")}\n`);
}

function main() {
  const allMetrics = buildAllMetrics();
  writeJson(allMetrics);
  writeMarkdown(allMetrics, shouldTolerateParseErrors());
  console.log(`Wrote ${GENERATED_FILES.codeFootprintSummary}`);
  console.log(`Wrote ${GENERATED_FILES.codeFootprintJson}`);
}

main();
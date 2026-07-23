import fs from "fs";
import path from "path";
import ts from "typescript";
import { GENERATED_FILES } from "./report-paths";

const escomplex = require("escomplex");

type SyntaxIssue = {
  filePath: string;
  stage: "typescript" | "complexity";
  message: string;
};

const MODELS = ["oauth", "jwt", "sessions"] as const;

function listSampleFiles(model: (typeof MODELS)[number]): string[] {
  const dir = path.join(process.cwd(), "ai-generated", model);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((name) => /^sample\d+\.ts$/i.test(name))
    .sort((a, b) => {
      const aNum = Number(a.match(/\d+/)?.[0] ?? 0);
      const bNum = Number(b.match(/\d+/)?.[0] ?? 0);
      return aNum - bNum;
    })
    .map((name) => path.join("ai-generated", model, name).replace(/\\/g, "/"));
}

function collectTypescriptDiagnostics(filePath: string, sourceText: string): string[] {
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const parseDiagnostics: readonly ts.DiagnosticWithLocation[] =
    ((sourceFile as unknown as { parseDiagnostics?: readonly ts.DiagnosticWithLocation[] }).parseDiagnostics ?? []);

  return parseDiagnostics.map((diagnostic: ts.DiagnosticWithLocation) => {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, " ");
    const position = diagnostic.start !== undefined ? sourceFile.getLineAndCharacterOfPosition(diagnostic.start) : null;
    if (!position) return message;
    return `L${position.line + 1}:C${position.character + 1} ${message}`;
  });
}

function collectComplexityDiagnostic(sourceText: string): string | null {
  try {
    const transpiled = ts.transpileModule(sourceText, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES5,
      },
    }).outputText;

    escomplex.analyse(transpiled);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

function main(): void {
  const issues: SyntaxIssue[] = [];
  const files = MODELS.flatMap((model) => listSampleFiles(model));

  for (const relativePath of files) {
    const absolutePath = path.join(process.cwd(), relativePath);
    const sourceText = fs.readFileSync(absolutePath, "utf8");

    for (const message of collectTypescriptDiagnostics(relativePath, sourceText)) {
      issues.push({ filePath: relativePath, stage: "typescript", message });
    }

    const complexityError = collectComplexityDiagnostic(sourceText);
    if (complexityError) {
      issues.push({ filePath: relativePath, stage: "complexity", message: complexityError });
    }
  }

  const markdown: string[] = [];
  markdown.push("# AI Sample Syntax Report");
  markdown.push("");
  markdown.push(`Generated: ${new Date().toISOString()}`);
  markdown.push("Regenerate: npm run ai:samples:syntax:check");
  markdown.push("");
  markdown.push(`Files scanned: ${files.length}`);
  markdown.push(`Issues found: ${issues.length}`);
  markdown.push("");

  if (issues.length > 0) {
    markdown.push("| File | Stage | Message |");
    markdown.push("|---|---|---|");
    for (const issue of issues) {
      markdown.push(`| ${issue.filePath} | ${issue.stage} | ${issue.message.replace(/\|/g, "\\|")} |`);
    }
  } else {
    markdown.push("No syntax or complexity-parser issues detected in AI sample files.");
  }

  fs.writeFileSync(path.join(process.cwd(), GENERATED_FILES.aiSampleSyntaxReport), `${markdown.join("\n")}\n`);
  fs.writeFileSync(
    path.join(process.cwd(), GENERATED_FILES.aiSampleSyntaxReportJson),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), fileCount: files.length, issueCount: issues.length, issues }, null, 2)}\n`
  );

  console.log(`Wrote ${GENERATED_FILES.aiSampleSyntaxReport}`);
  console.log(`Wrote ${GENERATED_FILES.aiSampleSyntaxReportJson}`);

  if (issues.length > 0) {
    console.error("AI sample syntax pre-check failed. Repair or regenerate malformed samples before running strict footprint analysis.");
    process.exit(1);
  }

  console.log("AI sample syntax pre-check passed.");
}

main();

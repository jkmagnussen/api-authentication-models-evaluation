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
const MODELS = ["oauth", "jwt", "sessions"];
function listSampleFiles(model) {
    const dir = path_1.default.join(process.cwd(), "ai-generated", model);
    if (!fs_1.default.existsSync(dir))
        return [];
    return fs_1.default
        .readdirSync(dir)
        .filter((name) => /^sample\d+\.ts$/i.test(name))
        .sort((a, b) => {
        const aNum = Number(a.match(/\d+/)?.[0] ?? 0);
        const bNum = Number(b.match(/\d+/)?.[0] ?? 0);
        return aNum - bNum;
    })
        .map((name) => path_1.default.join("ai-generated", model, name).replace(/\\/g, "/"));
}
function collectTypescriptDiagnostics(filePath, sourceText) {
    const sourceFile = typescript_1.default.createSourceFile(filePath, sourceText, typescript_1.default.ScriptTarget.Latest, true, typescript_1.default.ScriptKind.TS);
    const parseDiagnostics = (sourceFile.parseDiagnostics ?? []);
    return parseDiagnostics.map((diagnostic) => {
        const message = typescript_1.default.flattenDiagnosticMessageText(diagnostic.messageText, " ");
        const position = diagnostic.start !== undefined ? sourceFile.getLineAndCharacterOfPosition(diagnostic.start) : null;
        if (!position)
            return message;
        return `L${position.line + 1}:C${position.character + 1} ${message}`;
    });
}
function collectComplexityDiagnostic(sourceText) {
    try {
        const transpiled = typescript_1.default.transpileModule(sourceText, {
            compilerOptions: {
                module: typescript_1.default.ModuleKind.CommonJS,
                target: typescript_1.default.ScriptTarget.ES5,
            },
        }).outputText;
        escomplex.analyse(transpiled);
        return null;
    }
    catch (error) {
        return error instanceof Error ? error.message : String(error);
    }
}
function main() {
    const issues = [];
    const files = MODELS.flatMap((model) => listSampleFiles(model));
    for (const relativePath of files) {
        const absolutePath = path_1.default.join(process.cwd(), relativePath);
        const sourceText = fs_1.default.readFileSync(absolutePath, "utf8");
        for (const message of collectTypescriptDiagnostics(relativePath, sourceText)) {
            issues.push({ filePath: relativePath, stage: "typescript", message });
        }
        const complexityError = collectComplexityDiagnostic(sourceText);
        if (complexityError) {
            issues.push({ filePath: relativePath, stage: "complexity", message: complexityError });
        }
    }
    const markdown = [];
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
    }
    else {
        markdown.push("No syntax or complexity-parser issues detected in AI sample files.");
    }
    fs_1.default.writeFileSync(path_1.default.join(process.cwd(), report_paths_1.GENERATED_FILES.aiSampleSyntaxReport), `${markdown.join("\n")}\n`);
    fs_1.default.writeFileSync(path_1.default.join(process.cwd(), report_paths_1.GENERATED_FILES.aiSampleSyntaxReportJson), `${JSON.stringify({ generatedAt: new Date().toISOString(), fileCount: files.length, issueCount: issues.length, issues }, null, 2)}\n`);
    console.log(`Wrote ${report_paths_1.GENERATED_FILES.aiSampleSyntaxReport}`);
    console.log(`Wrote ${report_paths_1.GENERATED_FILES.aiSampleSyntaxReportJson}`);
    if (issues.length > 0) {
        console.error("AI sample syntax pre-check failed. Repair or regenerate malformed samples before running strict footprint analysis.");
        process.exit(1);
    }
    console.log("AI sample syntax pre-check passed.");
}
main();

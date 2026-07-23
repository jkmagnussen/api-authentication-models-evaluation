"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESULTS_DIR = exports.SAMPLE_COUNT = void 0;
exports.ensureDirectory = ensureDirectory;
exports.getModelDirectory = getModelDirectory;
exports.getSamplePath = getSamplePath;
exports.listSamplePaths = listSamplePaths;
exports.writeSampleFiles = writeSampleFiles;
exports.expandTemplateSamples = expandTemplateSamples;
exports.readSample = readSample;
exports.countFunctions = countFunctions;
exports.countClasses = countClasses;
exports.analyseSource = analyseSource;
exports.writeResult = writeResult;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const typescript_1 = __importDefault(require("typescript"));
const escomplex = require("escomplex");
const DEFAULT_SAMPLE_COUNT = 30;
function parseSampleCountArg() {
    const args = process.argv.slice(2);
    for (let index = 0; index < args.length; index += 1) {
        const current = args[index];
        if ((current === "--samples" || current === "-n") && args[index + 1]) {
            const parsed = Number(args[index + 1]);
            if (Number.isInteger(parsed) && parsed > 0) {
                return parsed;
            }
        }
    }
    return null;
}
function resolveSampleCount() {
    const fromArg = parseSampleCountArg();
    if (fromArg)
        return fromArg;
    const fromEnv = Number(process.env.AI_SAMPLE_COUNT ?? "");
    if (Number.isInteger(fromEnv) && fromEnv > 0) {
        return fromEnv;
    }
    return DEFAULT_SAMPLE_COUNT;
}
exports.SAMPLE_COUNT = resolveSampleCount();
exports.RESULTS_DIR = path_1.default.join(process.cwd(), "ai-generated", "results");
function ensureDirectory(dirPath) {
    if (!fs_1.default.existsSync(dirPath)) {
        fs_1.default.mkdirSync(dirPath, { recursive: true });
    }
}
function getModelDirectory(model) {
    return path_1.default.join(process.cwd(), "ai-generated", model);
}
function getSamplePath(model, index) {
    return path_1.default.join(getModelDirectory(model), `sample${index}.ts`);
}
function listSamplePaths(model) {
    return Array.from({ length: exports.SAMPLE_COUNT }, (_, index) => getSamplePath(model, index + 1));
}
function writeSampleFiles(model, samples) {
    ensureDirectory(getModelDirectory(model));
    samples.forEach((sample, index) => {
        fs_1.default.writeFileSync(getSamplePath(model, index + 1), sample);
    });
}
function expandTemplateSamples(templates, sampleCount = exports.SAMPLE_COUNT) {
    if (templates.length === 0)
        return [];
    const expanded = [];
    for (let index = 0; index < sampleCount; index += 1) {
        const template = templates[index % templates.length];
        expanded.push(`// deterministic_variant_${index + 1}\n${template}`);
    }
    return expanded;
}
function readSample(model, index) {
    return fs_1.default.readFileSync(getSamplePath(model, index), "utf8");
}
function countFunctions(sourceText) {
    const sourceFile = typescript_1.default.createSourceFile("sample.ts", sourceText, typescript_1.default.ScriptTarget.Latest, true, typescript_1.default.ScriptKind.TS);
    let functionCount = 0;
    function visit(node) {
        if (typescript_1.default.isFunctionDeclaration(node) ||
            typescript_1.default.isFunctionExpression(node) ||
            typescript_1.default.isArrowFunction(node) ||
            typescript_1.default.isMethodDeclaration(node)) {
            functionCount += 1;
        }
        typescript_1.default.forEachChild(node, visit);
    }
    visit(sourceFile);
    return functionCount;
}
function countClasses(sourceText) {
    const sourceFile = typescript_1.default.createSourceFile("sample.ts", sourceText, typescript_1.default.ScriptTarget.Latest, true, typescript_1.default.ScriptKind.TS);
    let classCount = 0;
    function visit(node) {
        if (typescript_1.default.isClassDeclaration(node)) {
            classCount += 1;
        }
        typescript_1.default.forEachChild(node, visit);
    }
    visit(sourceFile);
    return classCount;
}
function analyseSource(sourceText) {
    const transpiled = typescript_1.default.transpileModule(sourceText, {
        compilerOptions: {
            module: typescript_1.default.ModuleKind.CommonJS,
            target: typescript_1.default.ScriptTarget.ES2018,
        },
    }).outputText;
    return escomplex.analyse(transpiled);
}
function writeResult(fileName, value) {
    ensureDirectory(exports.RESULTS_DIR);
    fs_1.default.writeFileSync(path_1.default.join(exports.RESULTS_DIR, fileName), JSON.stringify(value, null, 2));
}

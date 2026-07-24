import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const escomplex = require('escomplex');

const DEFAULT_SAMPLE_COUNT = 30;

function parseSampleCountArg(): number | null {
  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index += 1) {
    const current = args[index];
    if ((current === '--samples' || current === '-n') && args[index + 1]) {
      const parsed = Number(args[index + 1]);
      if (Number.isInteger(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }

  return null;
}

function resolveSampleCount(): number {
  const fromArg = parseSampleCountArg();
  if (fromArg) return fromArg;

  const fromEnv = Number(process.env.AI_SAMPLE_COUNT ?? '');
  if (Number.isInteger(fromEnv) && fromEnv > 0) {
    return fromEnv;
  }

  return DEFAULT_SAMPLE_COUNT;
}

export const SAMPLE_COUNT = resolveSampleCount();
export const RESULTS_DIR = path.join(process.cwd(), 'ai-generated', 'results');

export function ensureDirectory(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function getModelDirectory(model: string) {
  return path.join(process.cwd(), 'ai-generated', model);
}

export function getSamplePath(model: string, index: number) {
  return path.join(getModelDirectory(model), `sample${index}.ts`);
}

export function listSamplePaths(model: string) {
  return Array.from({ length: SAMPLE_COUNT }, (_, index) => getSamplePath(model, index + 1));
}

export function writeSampleFiles(model: string, samples: string[]) {
  ensureDirectory(getModelDirectory(model));

  samples.forEach((sample, index) => {
    fs.writeFileSync(getSamplePath(model, index + 1), sample);
  });
}

export function expandTemplateSamples(templates: string[], sampleCount = SAMPLE_COUNT): string[] {
  if (templates.length === 0) return [];

  const expanded: string[] = [];
  for (let index = 0; index < sampleCount; index += 1) {
    const template = templates[index % templates.length];
    expanded.push(`// deterministic_variant_${index + 1}\n${template}`);
  }

  return expanded;
}

export function readSample(model: string, index: number) {
  return fs.readFileSync(getSamplePath(model, index), 'utf8');
}

export function countFunctions(sourceText: string) {
  const sourceFile = ts.createSourceFile(
    'sample.ts',
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );
  let functionCount = 0;

  function visit(node: ts.Node) {
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isMethodDeclaration(node)
    ) {
      functionCount += 1;
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return functionCount;
}

export function countClasses(sourceText: string) {
  const sourceFile = ts.createSourceFile(
    'sample.ts',
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );
  let classCount = 0;

  function visit(node: ts.Node) {
    if (ts.isClassDeclaration(node)) {
      classCount += 1;
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return classCount;
}

export function analyseSource(sourceText: string) {
  const transpiled = ts.transpileModule(sourceText, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2018,
    },
  }).outputText;

  return escomplex.analyse(transpiled);
}

export function writeResult(fileName: string, value: unknown) {
  ensureDirectory(RESULTS_DIR);
  fs.writeFileSync(path.join(RESULTS_DIR, fileName), JSON.stringify(value, null, 2));
}

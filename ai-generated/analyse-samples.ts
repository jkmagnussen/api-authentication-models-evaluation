import fs from "fs";
import path from "path";
import { analyseSource, countClasses, countFunctions, RESULTS_DIR, SAMPLE_COUNT, readSample, writeResult } from "./common";

const models = ["oauth", "jwt", "sessions"];

for (const model of models) {
  for (let index = 1; index <= SAMPLE_COUNT; index += 1) {
    const sourceText = readSample(model, index);
    try {
      const metrics = analyseSource(sourceText);

      writeResult(`${model}-sample${index}.json`, {
        model,
        sample: `sample${index}`,
        characters: sourceText.length,
        lines: sourceText.split(/\r?\n/).length,
        functions: countFunctions(sourceText),
        classes: countClasses(sourceText),
        cyclomaticComplexity: metrics.aggregate.cyclomatic,
        halstead: metrics.aggregate.halstead,
        maintainabilityIndex: metrics.maintainability,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);

      writeResult(`${model}-sample${index}.json`, {
        model,
        sample: `sample${index}`,
        characters: sourceText.length,
        lines: sourceText.split(/\r?\n/).length,
        functions: countFunctions(sourceText),
        classes: countClasses(sourceText),
        cyclomaticComplexity: Number.NaN,
        halstead: {
          difficulty: Number.NaN,
          volume: Number.NaN,
          effort: Number.NaN,
          bugs: Number.NaN,
          time: Number.NaN,
        },
        maintainabilityIndex: Number.NaN,
        analysisError: message,
      });
    }
  }
}

fs.writeFileSync(
  path.join(RESULTS_DIR, "analysis-summary.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), models }, null, 2)
);

console.log("Analysed AI-generated samples.");

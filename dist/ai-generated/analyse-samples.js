"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const common_1 = require("./common");
const models = ["oauth", "jwt", "sessions"];
for (const model of models) {
    for (let index = 1; index <= common_1.SAMPLE_COUNT; index += 1) {
        const sourceText = (0, common_1.readSample)(model, index);
        try {
            const metrics = (0, common_1.analyseSource)(sourceText);
            (0, common_1.writeResult)(`${model}-sample${index}.json`, {
                model,
                sample: `sample${index}`,
                characters: sourceText.length,
                lines: sourceText.split(/\r?\n/).length,
                functions: (0, common_1.countFunctions)(sourceText),
                classes: (0, common_1.countClasses)(sourceText),
                cyclomaticComplexity: metrics.aggregate.cyclomatic,
                halstead: metrics.aggregate.halstead,
                maintainabilityIndex: metrics.maintainability,
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            (0, common_1.writeResult)(`${model}-sample${index}.json`, {
                model,
                sample: `sample${index}`,
                characters: sourceText.length,
                lines: sourceText.split(/\r?\n/).length,
                functions: (0, common_1.countFunctions)(sourceText),
                classes: (0, common_1.countClasses)(sourceText),
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
fs_1.default.writeFileSync(path_1.default.join(common_1.RESULTS_DIR, "analysis-summary.json"), JSON.stringify({ generatedAt: new Date().toISOString(), models }, null, 2));
console.log("Analysed AI-generated samples.");

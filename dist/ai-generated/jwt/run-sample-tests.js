"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const common_1 = require("../common");
const checks_1 = require("../checks");
for (let index = 1; index <= common_1.SAMPLE_COUNT; index += 1) {
    const sourceText = (0, common_1.readSample)('jwt', index);
    const checks = (0, checks_1.runJwtChecks)(sourceText);
    const failedChecks = checks.filter((check) => !check.passed).map((check) => check.name);
    (0, common_1.writeResult)(`jwt-sample${index}-tests.json`, {
        model: 'jwt',
        sample: `sample${index}`,
        samplePath: path_1.default.join('ai-generated', 'jwt', `sample${index}.ts`),
        passed: failedChecks.length === 0,
        checks,
        correctnessFailures: failedChecks,
        securityFailures: failedChecks,
        misconfigurationDetections: failedChecks,
    });
}
console.log('Executed JWT AI sample tests.');

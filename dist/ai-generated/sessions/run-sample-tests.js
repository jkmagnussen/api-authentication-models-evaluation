"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const common_1 = require("../common");
const checks_1 = require("../checks");
for (let index = 1; index <= common_1.SAMPLE_COUNT; index += 1) {
    const sourceText = (0, common_1.readSample)('sessions', index);
    const checks = (0, checks_1.runSessionChecks)(sourceText);
    const failedChecks = checks.filter((check) => !check.passed).map((check) => check.name);
    (0, common_1.writeResult)(`sessions-sample${index}-tests.json`, {
        model: 'sessions',
        sample: `sample${index}`,
        samplePath: path_1.default.join('ai-generated', 'sessions', `sample${index}.ts`),
        passed: failedChecks.length === 0,
        checks,
        correctnessFailures: failedChecks,
        securityFailures: failedChecks,
        misconfigurationDetections: failedChecks,
    });
}
console.log('Executed session AI sample tests.');

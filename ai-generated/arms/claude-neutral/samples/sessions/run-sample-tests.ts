import path from "path";
import { SAMPLE_COUNT, readSample, writeResult } from "../common";
import { runSessionChecks } from "../checks";

for (let index = 1; index <= SAMPLE_COUNT; index += 1) {
  const sourceText = readSample("sessions", index);
  const checks = runSessionChecks(sourceText);
  const failedChecks = checks.filter((check) => !check.passed).map((check) => check.name);

  writeResult(`sessions-sample${index}-tests.json`, {
    model: "sessions",
    sample: `sample${index}`,
    samplePath: path.join("ai-generated", "sessions", `sample${index}.ts`),
    passed: failedChecks.length === 0,
    checks,
    correctnessFailures: failedChecks,
    securityFailures: failedChecks,
    misconfigurationDetections: failedChecks,
  });
}

console.log("Executed session AI sample tests.");

import path from "path";
import { SAMPLE_COUNT, readSample, writeResult } from "../common";
import { runJwtChecks } from "../checks";

for (let index = 1; index <= SAMPLE_COUNT; index += 1) {
  const sourceText = readSample("jwt", index);
  const checks = runJwtChecks(sourceText);
  const failedChecks = checks.filter((check) => !check.passed).map((check) => check.name);

  writeResult(`jwt-sample${index}-tests.json`, {
    model: "jwt",
    sample: `sample${index}`,
    samplePath: path.join("ai-generated", "jwt", `sample${index}.ts`),
    passed: failedChecks.length === 0,
    checks,
    correctnessFailures: failedChecks,
    securityFailures: failedChecks,
    misconfigurationDetections: failedChecks,
  });
}

console.log("Executed JWT AI sample tests.");

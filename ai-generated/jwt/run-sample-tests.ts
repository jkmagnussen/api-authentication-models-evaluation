import path from 'path';
import { SAMPLE_COUNT, getSamplePath, readSample, writeResult } from '../common';
import { runJwtChecks } from '../checks';

for (let index = 1; index <= SAMPLE_COUNT; index += 1) {
  const sourceText = readSample('jwt', index);
  const checks = runJwtChecks(sourceText);
  const failedChecks = checks.filter((check) => !check.passed).map((check) => check.name);

  writeResult(`jwt-sample${index}-tests.json`, {
    model: 'jwt',
    sample: `sample${index}`,
    samplePath: path.relative(process.cwd(), getSamplePath('jwt', index)),
    passed: failedChecks.length === 0,
    checks,
    correctnessFailures: failedChecks,
    securityFailures: failedChecks,
    misconfigurationDetections: failedChecks,
  });
}

console.log('Executed JWT AI sample tests.');

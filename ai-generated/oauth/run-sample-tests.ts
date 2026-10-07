import path from 'path';
import { SAMPLE_COUNT, getSamplePath, readSample, writeResult } from '../common';
import { runOAuthChecks } from '../checks';

for (let index = 1; index <= SAMPLE_COUNT; index += 1) {
  const sourceText = readSample('oauth', index);
  const checks = runOAuthChecks(sourceText);
  const failedChecks = checks.filter((check) => !check.passed).map((check) => check.name);

  writeResult(`oauth-sample${index}-tests.json`, {
    model: 'oauth',
    sample: `sample${index}`,
    samplePath: path.relative(process.cwd(), getSamplePath('oauth', index)),
    passed: failedChecks.length === 0,
    checks,
    correctnessFailures: failedChecks,
    securityFailures: failedChecks,
    misconfigurationDetections: failedChecks,
  });
}

console.log('Executed OAuth AI sample tests.');

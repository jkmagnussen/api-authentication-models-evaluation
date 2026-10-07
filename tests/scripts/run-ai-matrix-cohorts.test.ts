import fs from 'fs';
import os from 'os';
import path from 'path';
import { AiArm, buildStudyPlan, parseOptions, validateCohortArm } from '../../scripts/run-ai-matrix-cohorts';

const arm: AiArm = {
  key: 'openai-neutral',
  provider: 'openai',
  promptMode: 'neutral',
};

describe('isolated AI cohort study', () => {
  it('plans 30 matched cohorts of one as 30 per mechanism and 360 overall', () => {
    const options = parseOptions(['--cohorts', '30', '--sample-count', '1', '--study-id', 'test-study', '--plan']);
    const plan = buildStudyPlan(options);

    expect(plan.samplesPerMechanismPerArm).toBe(30);
    expect(plan.cohortCount).toBe(30);
    expect(plan.samplesPerMechanismPerCohort).toBe(1);
    expect(plan.samplesPerArm).toBe(90);
    expect(plan.totalSamples).toBe(360);
    expect(plan.maximumProviderRequests).toBe(1800);
    expect(plan.requestedModelIdentifiers).toEqual({
      openai: 'gpt-4o-2024-08-06',
      claude: 'claude-haiku-4-5-20251001',
    });
    expect(new Set(plan.orderByCohort.map((entry) => entry.armOrder.join(','))).size).toBeGreaterThan(1);
  });

  it('accepts only exact, complete, timestamped cohort outputs', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-cohort-'));
    const dataRoot = path.join(root, 'cohort-01', 'arms', arm.key);
    const resultsDir = path.join(dataRoot, 'results');
    fs.mkdirSync(resultsDir, { recursive: true });
    const sampleGenerations = [];

    for (const model of ['oauth', 'jwt', 'sessions']) {
      const modelDir = path.join(dataRoot, model);
      fs.mkdirSync(modelDir, { recursive: true });
      for (let sample = 1; sample <= 2; sample += 1) {
        fs.writeFileSync(path.join(modelDir, `sample${sample}.ts`), `${model} sample ${sample}`);
        fs.writeFileSync(path.join(resultsDir, `${model}-sample${sample}.json`), JSON.stringify({ model, sample: `sample${sample}` }));
        fs.writeFileSync(path.join(resultsDir, `${model}-sample${sample}-tests.json`), JSON.stringify({
          model,
          sample: `sample${sample}`,
          passed: sample === 1,
          correctnessFailures: [],
          securityFailures: [],
          misconfigurationDetections: [],
        }));
        sampleGenerations.push({
          model,
          sample,
          startedAt: '2026-10-05T10:00:00.000Z',
          completedAt: '2026-10-05T10:00:01.000Z',
          requestedModelIdentifier: 'gpt-4o-2024-08-06',
          returnedModelIdentifier: 'gpt-4o-2024-08-06',
          providerResponseId: `response-${model}-${sample}`,
          systemFingerprint: 'system-fingerprint',
          providerAttempts: 1,
          tokenUsage: {
            inputTokens: 10,
            outputTokens: 5,
            totalTokens: 15,
            cachedInputTokens: 0,
            cacheCreationInputTokens: null,
          },
        });
      }
    }

    fs.writeFileSync(path.join(resultsDir, 'generation-metadata.json'), JSON.stringify({
      provider: arm.provider,
      promptMode: arm.promptMode,
      promptProtocolVersion: 2,
      sampleCount: 2,
      providerModelIdentifier: 'gpt-4o-2024-08-06',
      providerEndpoint: 'https://api.openai.com/v1',
      providerApiVersion: null,
      retrySummary: { totalAttempts: 6, successfulRequests: 6, retries: 0 },
      generationParameters: { temperature: 0.8, maxTokens: 900 },
      startedAt: '2026-10-05T10:00:00.000Z',
      generatedAt: '2026-10-05T10:00:01.000Z',
      sampleGenerations,
    }));
    fs.writeFileSync(path.join(resultsDir, 'checker-agreement-summary.json'), JSON.stringify({
      generatedSampleAgreement: { observations: 6, kappa: 0.4 },
    }));
    for (const model of ['oauth', 'jwt', 'sessions']) {
      for (const [label, expectedPass] of [
        [`positive-control-${model}`, true],
        [`negative-control-${model}`, false],
      ] as const) {
        fs.writeFileSync(path.join(resultsDir, `${label}.json`), JSON.stringify({
          expectedPass,
          matchedExpectationPrimary: true,
          matchedExpectationSecondary: true,
        }));
      }
    }

    try {
      const validated = validateCohortArm(dataRoot, 2, arm);
      expect(validated.sampleResults).toHaveLength(6);
      expect(validated.checkerAgreement.generatedSampleAgreement?.observations).toBe(6);
      expect(validated.calibrationControls).toHaveLength(6);
      const generationPath = path.join(resultsDir, 'generation-metadata.json');
      const originalGeneration = fs.readFileSync(generationPath, 'utf8');
      const changedGeneration = JSON.parse(originalGeneration);
      changedGeneration.generationParameters.temperature = 0.2;
      fs.writeFileSync(generationPath, JSON.stringify(changedGeneration));
      expect(() => validateCohortArm(dataRoot, 2, arm)).toThrow(/generation settings do not match/);
      fs.writeFileSync(generationPath, originalGeneration);

      const oauthTestPath = path.join(resultsDir, 'oauth-sample1-tests.json');
      const originalOauthTest = fs.readFileSync(oauthTestPath, 'utf8');
      fs.writeFileSync(oauthTestPath, JSON.stringify({ ...JSON.parse(originalOauthTest), model: 'jwt' }));
      expect(() => validateCohortArm(dataRoot, 2, arm)).toThrow(/Mismatched test-result identity/);
      fs.writeFileSync(oauthTestPath, originalOauthTest);

      fs.writeFileSync(path.join(dataRoot, 'oauth', 'sample3.ts'), 'stale sample');
      expect(() => validateCohortArm(dataRoot, 2, arm)).toThrow(/has 3 sample files; expected exactly 2/);
      fs.rmSync(path.join(dataRoot, 'oauth', 'sample3.ts'));
      const generation = JSON.parse(fs.readFileSync(generationPath, 'utf8'));
      generation.sampleGenerations[0].returnedModelIdentifier = 'gpt-newer-model';
      fs.writeFileSync(generationPath, JSON.stringify(generation));
      expect(() => validateCohortArm(dataRoot, 2, arm)).toThrow(/multiple model identifiers within one cohort/);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
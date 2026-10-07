import {
  armDenominatorMatches,
  bootstrapDelta95,
  deriveBootstrapSeed,
  extractCohortRates,
  holmBonferroni,
  OverallArm,
  pairedCohortDifferences,
  pairedCohortTTest,
  wilson95,
} from '../../scripts/generate-ai-provider-blinded-report';

function cohortRates(jwtFailures: number, sessionFailures: number): OverallArm['cohortRates'] {
  return Array.from({ length: 30 }, (_, index) => {
    const failed = Number(index < 27) + Number(index < jwtFailures) + Number(index < sessionFailures);
    return {
      cohort: index + 1,
      failed,
      total: 3,
      failureRatePct: (failed / 3) * 100,
    };
  });
}

const verifiedCohorts = Array.from({ length: 30 }, (_, index) => ({
  cohort: index + 1,
  resultsByMechanism: {
    oauth: { totalSamples: 1, failedSamples: Number(index < 27) },
    jwt: { totalSamples: 1, failedSamples: Number(index < 8) },
    sessions: { totalSamples: 1, failedSamples: Number(index < 9) },
  },
}));

const openAiNeutral: OverallArm = {
  armId: 'C',
  failed: 44,
  total: 90,
  failureRatePct: 48.9,
  cohortRates: cohortRates(8, 9),
};

const openAiGuided: OverallArm = {
  armId: 'D',
  failed: 34,
  total: 90,
  failureRatePct: 37.8,
  cohortRates: cohortRates(3, 4),
};

const armRows = [
  { label: 'OAUTH', totalSamples: 30, passedSamples: 3, failedSamples: 27, failureRatePct: 90 },
  { label: 'JWT', totalSamples: 30, passedSamples: 22, failedSamples: 8, failureRatePct: 26.7 },
  { label: 'SESSIONS', totalSamples: 30, passedSamples: 21, failedSamples: 9, failureRatePct: 30 },
  { label: 'OVERALL', totalSamples: 90, passedSamples: 46, failedSamples: 44, failureRatePct: 48.9 },
];

describe('AI provider blinded report statistics', () => {
  it('rejects legacy metadata whose recorded sample count conflicts with aggregate CSV denominators', () => {
    expect(armDenominatorMatches({ protocolVersion: 1, promptProtocolVersion: 1, analysisMethodVersion: 2, samplesPerMechanism: 5, totalSamples: 15 }, armRows)).toBe(false);
    expect(armDenominatorMatches({ protocolVersion: 1, promptProtocolVersion: 2, analysisMethodVersion: 1, samplesPerMechanism: 5, totalSamples: 15 }, armRows)).toBe(false);
    expect(armDenominatorMatches({
      protocolVersion: 1,
      promptProtocolVersion: 2,
      analysisMethodVersion: 2,
      samplesPerMechanism: 30,
      samplesPerMechanismPerCohort: 1,
      cohortCount: 30,
      totalSamples: 90,
      generationCohorts: verifiedCohorts,
    }, armRows)).toBe(true);
  });

  it('uses paired cohort outcomes as the inferential unit and bootstraps those blocks reproducibly', () => {
    expect(pairedCohortDifferences(openAiNeutral, openAiGuided)).toHaveLength(30);
    expect(deriveBootstrapSeed(openAiNeutral, openAiGuided)).toBe(deriveBootstrapSeed(openAiNeutral, openAiGuided));
    const interval = bootstrapDelta95(openAiNeutral, openAiGuided);
    expect(interval).toHaveLength(2);
    expect(interval?.[0]).toBeLessThanOrEqual(interval?.[1] ?? Number.POSITIVE_INFINITY);
  });

  it('extracts cohort failure rates in percentage points', () => {
    const rates = extractCohortRates({
      protocolVersion: 1,
      promptProtocolVersion: 2,
      analysisMethodVersion: 2,
      samplesPerMechanism: 30,
      samplesPerMechanismPerCohort: 1,
      cohortCount: 30,
      totalSamples: 90,
      generationCohorts: verifiedCohorts,
    });
    expect(rates[0].failureRatePct).toBe(100);
  });

  it('keeps a finite lower confidence bound when every output fails', () => {
    const interval = wilson95(90, 90);
    expect(interval?.[0]).toBeCloseTo(0.959, 3);
    expect(interval?.[1]).toBe(1);
  });

  it('uses a paired t-test over cohort percentage-point differences', () => {
    expect(pairedCohortTTest([10, -5, 0])?.degreesOfFreedom).toBe(2);
    expect(pairedCohortTTest([10]) ).toBeNull();
  });

  it('applies Holm-Bonferroni adjustment across the supplied contrast family', () => {
    expect(holmBonferroni([0.01, 0.04, 0.03])).toEqual([0.03, 0.06, 0.06]);
  });
});
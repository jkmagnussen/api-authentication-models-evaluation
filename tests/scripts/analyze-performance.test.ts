import {
  ci95OfPairedMean,
  holmBonferroni,
  isVerifiedMatchedMetadata,
  pairedMetricDeltas,
  pairedDeltas,
  pairedTTest,
  buildPerformanceInterpretation,
  derivePairedBootstrapSeed,
  exceedsPracticalThreshold,
  pairedBootstrapMean95,
  RunSample,
} from '../../scripts/analyze-performance';

function validMetadata() {
  return {
    protocolVersion: 7,
    matchedBlockVerified: true,
    status: 'completed',
    conditionOrder: ['baseline', 'attacks'],
    conditions: {
      baseline: {
        order: 1,
        status: 'completed',
        startedAt: '2026-10-05T10:00:00.000Z',
        completedAt: '2026-10-05T10:01:00.000Z',
      },
      attacks: {
        order: 2,
        status: 'completed',
        startedAt: '2026-10-05T10:01:01.000Z',
        completedAt: '2026-10-05T10:02:00.000Z',
      },
    },
  };
}

describe('performance matched-block analysis', () => {
  it('accepts complete sequential blocks and rejects legacy or overlapping blocks', () => {
    expect(isVerifiedMatchedMetadata(validMetadata())).toBe(true);
    expect(isVerifiedMatchedMetadata(null)).toBe(false);

    const outdatedProtocolMetadata = validMetadata();
    outdatedProtocolMetadata.protocolVersion = 6;
    expect(isVerifiedMatchedMetadata(outdatedProtocolMetadata)).toBe(false);

    const overlappingMetadata = validMetadata();
    overlappingMetadata.conditions.attacks.startedAt = '2026-10-05T10:00:30.000Z';
    expect(isVerifiedMatchedMetadata(overlappingMetadata)).toBe(false);
  });

  it('calculates deltas only from verified matching run IDs', () => {
    const baseline: RunSample[] = [
      { runId: 'verified', values: [2], verifiedMatchedBlock: true },
      { runId: 'legacy', values: [5], verifiedMatchedBlock: false },
    ];
    const attacks: RunSample[] = [
      { runId: 'verified', values: [3], verifiedMatchedBlock: true },
      { runId: 'legacy', values: [10], verifiedMatchedBlock: false },
      { runId: 'unmatched', values: [4], verifiedMatchedBlock: true },
    ];

    expect(pairedDeltas(baseline, attacks)).toEqual([50]);
  });

  it('pairs percentile metrics by verified run ID and Holm-adjusts a contrast family', () => {
    const baseline: RunSample[] = [
      { runId: 'paired', values: [2], verifiedMatchedBlock: true, summary: { p95: 4 } },
    ];
    const attacks: RunSample[] = [
      { runId: 'paired', values: [3], verifiedMatchedBlock: true, summary: { p95: 5 } },
    ];

    expect(pairedMetricDeltas(baseline, attacks, 'p95')).toEqual([25]);
    expect(holmBonferroni([0.01, 0.04, 0.03])).toEqual([0.03, 0.06, 0.06]);
  });

  it('does not describe faster rejection as improved normal workload performance', () => {
    expect(buildPerformanceInterpretation({ avg: 5 }, { avg: 3 })).toContain('not evidence of improved normal-workload capacity');
  });

  it('bootstraps whole paired-block effects deterministically and evaluates threshold sensitivity', () => {
    const pairedDifferences = [-2.1, -1.8, -2.0, -1.9, -2.2];
    const seed = derivePairedBootstrapSeed('jwt', pairedDifferences);
    expect(pairedBootstrapMean95(pairedDifferences, seed, 2000)).toEqual(
      pairedBootstrapMean95(pairedDifferences, seed, 2000)
    );
    expect(pairedBootstrapMean95(pairedDifferences, seed, 2000)?.[1]).toBeLessThan(0);
    expect(exceedsPracticalThreshold(-2, 1)).toBe(true);
    expect(exceedsPracticalThreshold(-2, 3)).toBe(false);
  });

  it('reports paired t inference only with at least two non-constant differences', () => {
    expect(pairedTTest([1])).toBeNull();
    expect(pairedTTest([2, 2])).toBeNull();
    expect(pairedTTest([1, 2, 3])?.df).toBe(2);
    expect(ci95OfPairedMean([1, 2, 3])?.[0]).toBeCloseTo(-0.484, 2);
    expect(pairedTTest([1, 1.01, 0.99])?.pValue).toBeGreaterThan(0);
  });
});
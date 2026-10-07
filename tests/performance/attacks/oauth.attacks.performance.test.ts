import request from 'supertest';
import app from '../../../src/app';
import { resetDatabase } from '../../setup';
import { calculateStats, createPerformanceHttpClient, writePerformanceResult } from '../utils';

describe('OAuth – Attack Performance Test', () => {
  const ITERATIONS = 1000;

  // Intentionally invalid / replayed authorization code
  const invalidCode = 'REPLAYED_OR_INVALID_CODE';
  let performanceClient: Awaited<ReturnType<typeof createPerformanceHttpClient>>;

  beforeAll(async () => {
    await resetDatabase();
    performanceClient = await createPerformanceHttpClient(app);
  });

  afterAll(async () => {
    if (performanceClient) await performanceClient.close();
  });

  test(`OAuth protected resource under invalid-token attack (${ITERATIONS} requests)`, async () => {
    const times: number[] = [];
    let errors = 0;

    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now();

      const status = await performanceClient.get('/oauth/protected', { Authorization: `Bearer ${invalidCode}` });

      const end = performance.now();
      times.push(end - start);

      if (status !== 401) throw new Error(`Expected OAuth attack status 401, received ${status}`);
      errors++;
    }

    const stats = calculateStats(times);

    const attackStats = {
      ...stats,
      errorRate: errors / ITERATIONS,
    };

    writePerformanceResult('attacks', 'oauth', attackStats, times);
  });
});

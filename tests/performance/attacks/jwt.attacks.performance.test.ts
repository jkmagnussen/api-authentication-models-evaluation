import request from 'supertest';
import app from '../../../src/app';
import { resetDatabase } from '../../setup';
import { calculateStats, createPerformanceHttpClient, writePerformanceResult } from '../utils';

describe('JWT – Attack Performance Test', () => {
  const ITERATIONS = 1000;

  // Use an intentionally invalid / expired / forged token
  const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.INVALID.ATTACKTOKEN';
  let performanceClient: Awaited<ReturnType<typeof createPerformanceHttpClient>>;

  beforeAll(async () => {
    await resetDatabase();
    performanceClient = await createPerformanceHttpClient(app);
  });

  afterAll(async () => {
    if (performanceClient) await performanceClient.close();
  });

  test(`JWT protected route under replay/invalid-token attack (${ITERATIONS} requests)`, async () => {
    const times: number[] = [];
    let errors = 0;

    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now();

      const status = await performanceClient.get('/jwt/protected', { Authorization: `Bearer ${invalidToken}` });

      const end = performance.now();
      times.push(end - start);

      if (status !== 401) throw new Error(`Expected JWT attack status 401, received ${status}`);
      errors++;
    }

    const stats = calculateStats(times);

    // Add error rate to the stats object
    const attackStats = {
      ...stats,
      errorRate: errors / ITERATIONS,
    };

    writePerformanceResult('attacks', 'jwt', attackStats, times);
  });
});

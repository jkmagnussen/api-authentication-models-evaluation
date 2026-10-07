import request from 'supertest';
import app from '../../../src/app';
import { resetDatabase } from '../../setup';
import { calculateStats, createPerformanceHttpClient, writePerformanceResult } from '../utils';

describe('Sessions – Attack Performance Test', () => {
  const ITERATIONS = 1000;

  const invalidSessionCookie = 'sessionId=INVALID_ATTACK_COOKIE';
  let performanceClient: Awaited<ReturnType<typeof createPerformanceHttpClient>>;

  beforeAll(async () => {
    await resetDatabase();
    performanceClient = await createPerformanceHttpClient(app);
  });

  afterAll(async () => {
    if (performanceClient) await performanceClient.close();
  });

  test(`Session protected route under invalid session ID attack (${ITERATIONS} requests)`, async () => {
    const times: number[] = [];
    let errors = 0;

    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now();

      const status = await performanceClient.get('/sessions/protected', { Cookie: invalidSessionCookie });

      const end = performance.now();
      times.push(end - start);

      if (status !== 401) throw new Error(`Expected Sessions attack status 401, received ${status}`);
      errors++;
    }

    const stats = calculateStats(times);

    const attackStats = {
      ...stats,
      errorRate: errors / ITERATIONS,
    };

    writePerformanceResult('attacks', 'sessions', attackStats, times);
  });
});

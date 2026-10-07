import request from 'supertest';
import app from '../../../src/app';
import { prisma } from '../../../src/db';
import { resetDatabase } from '../../setup';
import { calculateStats, createPerformanceHttpClient, writePerformanceResult } from '../utils';

describe('JWT – Performance Test', () => {
  const ITERATIONS = 1000;
  let token: string;
  let performanceClient: Awaited<ReturnType<typeof createPerformanceHttpClient>>;

  beforeAll(async () => {
    await resetDatabase();
    await prisma.user.create({
      data: { id: 'user-123', email: 'test@example.com', password: 'password' },
    });

    const res = await request(app)
      .post('/jwt/login')
      .send({ email: 'test@example.com', password: 'password' });

    if (res.status !== 200 || typeof res.body.token !== 'string') {
      throw new Error(`JWT login setup failed with status ${res.status}`);
    }
    token = res.body.token;
    performanceClient = await createPerformanceHttpClient(app);
  });

  afterAll(async () => {
    if (performanceClient) await performanceClient.close();
  });

  test(`JWT protected route ${ITERATIONS} requests`, async () => {
    const times: number[] = [];

    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now();

      const status = await performanceClient.get('/jwt/protected', { Authorization: `Bearer ${token}` });

      const end = performance.now();
      times.push(end - start);
      if (status !== 200) throw new Error(`Expected JWT baseline status 200, received ${status}`);
    }

    const stats = calculateStats(times);
    writePerformanceResult('baseline', 'jwt', stats, times);
  });
});

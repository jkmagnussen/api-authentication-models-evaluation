import request from 'supertest';
import app from '../../../src/app';
import { resetDatabase } from '../../setup';
import { calculateStats, createPerformanceHttpClient, writePerformanceResult } from '../utils';
import { prisma } from '../../../src/db'; // adjust if your DB import differs

describe('Sessions – Performance Test', () => {
  const ITERATIONS = 1000;
  let sessionCookie: string;
  let performanceClient: Awaited<ReturnType<typeof createPerformanceHttpClient>>;

  beforeAll(async () => {
    await resetDatabase();

    // Seed user directly (bypasses CSRF, cookies, middleware)
    await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'password', // or hashed if your login expects hashing
      },
    });

    // Login to obtain a valid session cookie
    const res = await request(app)
      .post('/sessions/login')
      .send({ email: 'test@example.com', password: 'password' });

    const cookies = res.headers['set-cookie'];

    if (!cookies || cookies.length === 0) {
      throw new Error('No session cookie returned from /sessions/login');
    }

    sessionCookie = cookies[0];
    performanceClient = await createPerformanceHttpClient(app);
  });

  afterAll(async () => {
    if (performanceClient) await performanceClient.close();
  });

  test(`Session protected route ${ITERATIONS} requests`, async () => {
    const times: number[] = [];

    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now();

      const status = await performanceClient.get('/sessions/protected', { Cookie: sessionCookie });

      const end = performance.now();
      times.push(end - start);
      if (status !== 200) throw new Error(`Expected Sessions baseline status 200, received ${status}`);
    }

    const stats = calculateStats(times);
    writePerformanceResult('baseline', 'sessions', stats, times);
  });
});

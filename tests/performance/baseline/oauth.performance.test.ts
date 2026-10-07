import request from 'supertest';
import app from '../../../src/app';
import { prisma } from '../../../src/db';
import { createPkcePair } from '../../../src/oauth/pkce';
import { resetDatabase } from '../../setup';
import { calculateStats, createPerformanceHttpClient, writePerformanceResult } from '../utils';

describe('OAuth – Performance Test', () => {
  const ITERATIONS = 1000;
  const userId = '123e4567-e89b-12d3-a456-426614174000';
  let accessToken: string;
  let performanceClient: Awaited<ReturnType<typeof createPerformanceHttpClient>>;

  beforeAll(async () => {
    await resetDatabase();
    await prisma.user.create({
      data: { id: userId, email: 'perf-oauth@example.com', password: 'not-used-by-authorize' },
    });
    const { code_verifier, code_challenge } = await createPkcePair();
    const authorizeRes = await request(app).post('/oauth/authorize').send({
      userId,
      clientId: 'client-basic',
      scope: 'read',
      code_challenge,
      code_challenge_method: 'S256',
    });
    if (authorizeRes.status !== 200 || typeof authorizeRes.body.code !== 'string') {
      throw new Error(`OAuth authorize setup failed with status ${authorizeRes.status}`);
    }

    const tokenRes = await request(app).post('/oauth/token').send({
      code: authorizeRes.body.code,
      clientId: 'client-basic',
      code_verifier,
    });
    if (tokenRes.status !== 200 || typeof tokenRes.body.access_token !== 'string') {
      throw new Error(`OAuth token setup failed with status ${tokenRes.status}`);
    }

    accessToken = tokenRes.body.access_token;
    performanceClient = await createPerformanceHttpClient(app);
  });

  afterAll(async () => {
    if (performanceClient) await performanceClient.close();
  });

  test(`OAuth protected resource ${ITERATIONS} requests`, async () => {
    const times: number[] = [];

    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now();
      const status = await performanceClient.get('/oauth/protected', { Authorization: `Bearer ${accessToken}` });
      const end = performance.now();
      times.push(end - start);
      if (status !== 200) throw new Error(`Expected OAuth baseline status 200, received ${status}`);
    }

    const stats = calculateStats(times);
    writePerformanceResult('baseline', 'oauth', stats, times);
  });
});

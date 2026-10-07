import request from 'supertest';
import app from '../../../src/app';
import { prisma } from '../../../src/db';
import { resetDatabase } from '../../setup';
import APP_CONFIG from '../../../src/config';

describe('Session Authentication – Login', () => {
  let sessionId: string;

  beforeEach(async () => {
    await resetDatabase();

    await prisma.user.create({
      data: {
        id: 'user-123',
        email: 'test@example.com',
        password: 'password',
      },
    });
  });

  test('Login creates a session row and sets a cookie', async () => {
    const res = await request(app)
      .post('/sessions/login')
      .send({ email: 'test@example.com', password: 'password' });

    const cookie = res.headers['set-cookie'];
    expect(cookie).toBeDefined();

    sessionId = cookie[0].split(';')[0].split('=')[1];

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    expect(session).not.toBeNull();
    const maximumCookieAgeSeconds = Math.floor(Math.min(
      APP_CONFIG.cookie.maxAgeMs,
      APP_CONFIG.session.ttlSeconds * 1000
    ) / 1000);
    expect(cookie[0]).toContain(`Max-Age=${maximumCookieAgeSeconds}`);
    expect(session?.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + APP_CONFIG.session.ttlSeconds * 1000);
  });
});

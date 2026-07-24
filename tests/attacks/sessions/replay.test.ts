import request from 'supertest';
import app from '../../../src/app';
import { resetDatabase } from '../../setup';
import { prisma } from '../../../src/db';

describe('Sessions – Replay Attack Test', () => {
  let cookie: string;

  beforeAll(async () => {
    await resetDatabase();

    await prisma.user.create({
      data: {
        id: 'user-123',
        email: 'test@example.com',
        password: 'password',
      },
    });

    // Login → get a valid session cookie
    const res = await request(app)
      .post('/sessions/login')
      .send({ email: 'test@example.com', password: 'password' });

    cookie = res.headers['set-cookie'][0];
  });

  test('Reusing the same session cookie should still succeed until session expiry', async () => {
    const firstRes = await request(app).get('/sessions/protected').set('Cookie', cookie);

    expect(firstRes.status).toBe(200);

    const replayRes = await request(app).get('/sessions/protected').set('Cookie', cookie);

    expect(replayRes.status).toBe(200);
  });

  test('Replayed cookie after logout should fail', async () => {
    await request(app).post('/sessions/logout').set('Cookie', cookie);

    const res = await request(app).get('/sessions/protected').set('Cookie', cookie);

    expect(res.status).toBe(401);
  });

  test('A fresh login should replace a previously issued session cookie', async () => {
    const firstLogin = await request(app)
      .post('/sessions/login')
      .send({ email: 'test@example.com', password: 'password' });

    const firstCookie = firstLogin.headers['set-cookie'][0];

    const secondLogin = await request(app)
      .post('/sessions/login')
      .set('Cookie', firstCookie)
      .send({ email: 'test@example.com', password: 'password' });

    const secondCookie = secondLogin.headers['set-cookie'][0];

    const oldSessionRes = await request(app).get('/sessions/protected').set('Cookie', firstCookie);

    const newSessionRes = await request(app).get('/sessions/protected').set('Cookie', secondCookie);

    expect(oldSessionRes.status).toBe(401);
    expect(newSessionRes.status).toBe(200);
  });
});

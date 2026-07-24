import request from 'supertest';
import app from '../../../src/app';
import { prisma } from '../../../src/db';
import { resetDatabase } from '../../setup';

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
  });
});

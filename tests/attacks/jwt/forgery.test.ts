import request from 'supertest';
import app from '../../../src/app';
import { prisma } from '../../../src/db';
import { resetDatabase } from '../../setup';

let validToken: string;

describe('JWT – Forgery Attack Tests', () => {
  beforeEach(async () => {
    await resetDatabase();

    // ⭐ Create user AFTER resetDatabase
    await prisma.user.create({
      data: {
        id: 'user-123',
        email: 'test@example.com',
        password: 'password',
      },
    });

    // ⭐ Login to get a valid token
    const res = await request(app)
      .post('/jwt/login')
      .send({ email: 'test@example.com', password: 'password' });

    validToken = res.body.token;
  });

  test('Tampered payload should be rejected', async () => {
    const parts = validToken.split('.');
    const header = parts[0];
    const signature = parts[2];

    const tamperedPayload = Buffer.from(JSON.stringify({ userId: 'attacker' })).toString(
      'base64url'
    );

    const tamperedToken = `${header}.${tamperedPayload}.${signature}`;

    const res = await request(app)
      .get('/jwt/protected')
      .set('Authorization', `Bearer ${tamperedToken}`);

    expect(res.status).toBe(401);
  });
});

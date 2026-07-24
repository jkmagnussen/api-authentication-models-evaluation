import request from 'supertest';
import app from '../../../src/app';
import { prisma } from '../../../src/db';
import { resetDatabase } from '../../setup';
import jwt from 'jsonwebtoken';

describe('JWT – Expired Token Attack Test', () => {
  let expiredToken: string;

  beforeAll(async () => {
    await resetDatabase();

    await prisma.user.create({
      data: {
        id: 'user-123',
        email: 'test@example.com',
        password: 'password',
      },
    });

    // Create a valid user first
    const res = await request(app)
      .post('/jwt/login')
      .send({ email: 'test@example.com', password: 'password' });

    const validToken = res.body.token;

    // Decode the valid token to reuse header + payload structure
    const decoded: any = jwt.decode(validToken, { complete: true }) || {
      payload: {},
      header: { alg: 'HS256' },
    };

    // Create an expired token using the same secret
    expiredToken = jwt.sign(
      {
        ...decoded.payload,
        exp: Math.floor(Date.now() / 1000) - 60, // expired 60 seconds ago
      },
      process.env.JWT_SECRET || 'dev-secret', // match your app's secret
      { algorithm: decoded.header?.alg || 'HS256' }
    );
  });

  test('Expired JWT should be rejected', async () => {
    const res = await request(app)
      .get('/jwt/protected')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
  });
});

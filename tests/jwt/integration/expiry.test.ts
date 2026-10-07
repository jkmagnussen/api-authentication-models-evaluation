import request from 'supertest';
import app from '../../../src/app';
import jwt from 'jsonwebtoken';
import { resetDatabase } from '../../setup';
import { prisma } from '../../../src/db';

describe('JWT Authentication – Expiry', () => {
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

  test('Expired JWT returns 401', async () => {
    const previousSecret = process.env.JWT_SECRET;
    const previousAlgorithm = process.env.JWT_ALGORITHM;
    process.env.JWT_SECRET = 'dev-secret';
    process.env.JWT_ALGORITHM = 'HS256';

    try {
      // Put expiry in the past so the test never depends on a sleep or wall-clock timing.
      const expiredToken = jwt.sign({ userId: 'user-123' }, process.env.JWT_SECRET, {
        algorithm: 'HS256',
        expiresIn: -10,
      });

      const res = await request(app)
        .get('/jwt/protected')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Token expired');
    } finally {
      if (previousSecret === undefined) delete process.env.JWT_SECRET;
      else process.env.JWT_SECRET = previousSecret;
      if (previousAlgorithm === undefined) delete process.env.JWT_ALGORITHM;
      else process.env.JWT_ALGORITHM = previousAlgorithm;
    }
  });
});

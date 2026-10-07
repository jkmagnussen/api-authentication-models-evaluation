import request from 'supertest';
import app from '../../../src/app';
import jwt from 'jsonwebtoken';
import { resetDatabase } from '../../setup';
import { prisma } from '../../../src/db';

describe('JWT Authentication – Invalid Tokens', () => {
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

  test('Missing JWT returns 401', async () => {
    const res = await request(app).get('/jwt/protected');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('No token provided');
  });

  test('Invalid JWT returns 401', async () => {
    const res = await request(app)
      .get('/jwt/protected')
      .set('Authorization', 'Bearer invalid.token.here');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid token');
  });

  test('Rejects a token using an unconfigured algorithm and missing audience/issuer claims', async () => {
    const previousAlgorithm = process.env.JWT_ALGORITHM;
    const previousSecret = process.env.JWT_SECRET;
    process.env.JWT_ALGORITHM = 'RS256';
    process.env.JWT_SECRET = 'synthetic-audit-only-secret';
    // The HS256 header is deliberate; token input must not choose the verifier's algorithm.
    const token = jwt.sign({ userId: 'user-123' }, process.env.JWT_SECRET, { algorithm: 'HS256' });

    try {
      const res = await request(app)
        .get('/jwt/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
    } finally {
      if (previousAlgorithm === undefined) delete process.env.JWT_ALGORITHM;
      else process.env.JWT_ALGORITHM = previousAlgorithm;
      if (previousSecret === undefined) delete process.env.JWT_SECRET;
      else process.env.JWT_SECRET = previousSecret;
    }
  });
});

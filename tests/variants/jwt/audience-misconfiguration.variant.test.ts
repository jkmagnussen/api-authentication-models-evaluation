import jwt from 'jsonwebtoken';
import request from 'supertest';
import { loadVariantApp } from '../load-variant-app';

process.env.JWT_ALGORITHM = 'HS256';
process.env.JWT_SECRET = 'variant-audit-test-secret';
const app = loadVariantApp();
const secret = process.env.JWT_SECRET;

describe('JWT audience misconfiguration exploit', () => {
  it('accepts token minted for a weak audience value', async () => {
    const token = jwt.sign({ userId: 'user-123', aud: 'anyone', iss: 'api-auth-service' }, secret, {
      expiresIn: '1h',
    });

    const res = await request(app).get('/jwt/protected').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe('user-123');
  });
});

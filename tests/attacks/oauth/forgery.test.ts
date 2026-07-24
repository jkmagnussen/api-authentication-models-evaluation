import request from 'supertest';
import app from '../../../src/app';
import { resetDatabase } from '../../setup';

describe('OAuth – Token Forgery Attack', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  test('Forged access token should be rejected', async () => {
    const res = await request(app)
      .get('/oauth/protected')
      .set('Authorization', 'Bearer forged-token');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid or expired token');
  });
});

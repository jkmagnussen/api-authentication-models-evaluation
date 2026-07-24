import request from 'supertest';
import { loadVariantApp } from '../load-variant-app';
import { resetDatabase } from '../../setup';
import { prisma } from '../../../src/db';

const app = loadVariantApp();

describe('OAuth redirect misconfiguration exploit', () => {
  beforeEach(async () => {
    await resetDatabase();

    await prisma.user.create({
      data: {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'test@example.com',
        password: 'hashed-password',
      },
    });
  });

  it('accepts evil redirect URI that baseline rejects', async () => {
    const res = await request(app).post('/oauth/authorize').send({
      userId: '11111111-1111-1111-1111-111111111111',
      clientId: 'client-basic',
      scope: 'read',
      redirectUri: 'http://evil.com',
    });

    expect(res.status).toBe(200);
    expect(res.body.code).toBeDefined();
  });
});

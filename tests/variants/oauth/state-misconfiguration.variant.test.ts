import request from 'supertest';
import { loadVariantApp } from '../load-variant-app';
import { resetDatabase } from '../../setup';
import { prisma } from '../../../src/db';

const app = loadVariantApp();
const validUuid = '123e4567-e89b-12d3-a456-426614174000';

describe('OAuth state misconfiguration exploit', () => {
  beforeEach(async () => {
    await resetDatabase();

    await prisma.user.create({
      data: {
        id: validUuid,
        email: 'test@example.com',
        password: 'hashed-password',
      },
    });
  });

  it('exchanges a code even when state does not match', async () => {
    const authorizeRes = await request(app).post('/oauth/authorize').send({
      userId: validUuid,
      clientId: 'client-basic',
      scope: 'read',
      state: 'expected-state',
      code_challenge: 'state-proof',
      code_challenge_method: 'plain',
    });

    const tokenRes = await request(app).post('/oauth/token').send({
      code: authorizeRes.body.code,
      state: 'attacker-state',
      code_verifier: 'state-proof',
    });

    expect(tokenRes.status).toBe(200);
    expect(tokenRes.body.access_token).toBeDefined();
  });
});

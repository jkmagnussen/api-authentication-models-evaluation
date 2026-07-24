import request from 'supertest';
import app from '../../../src/app';
import { prisma } from '../../../src/db';
import { resetDatabase } from '../../setup';

const validUUID = '123e4567-e89b-12d3-a456-426614174000';

describe('OAuth – Replay Attack', () => {
  beforeEach(async () => {
    await resetDatabase();

    await prisma.user.create({
      data: {
        id: validUUID,
        email: 'test@example.com',
        password: 'hashed-password',
      },
    });
  });

  it('Reusing an authorization code should be rejected', async () => {
    await request(app).post('/oauth/authorize').send({
      userId: validUUID,
      clientId: 'client-basic',
      scope: 'read',
      code_challenge: 'abc',
      code_challenge_method: 'plain',
    });

    const stored = await prisma.oAuthAuthorizationCode.findFirst();

    const firstRes = await request(app).post('/oauth/token').send({
      code: stored?.code,
      code_verifier: 'abc',
      clientId: 'client-basic',
    });

    expect(firstRes.status).toBe(200);
    expect(firstRes.body).toHaveProperty('access_token');

    const replayRes = await request(app).post('/oauth/token').send({
      code: stored?.code,
      code_verifier: 'abc',
      clientId: 'client-basic',
    });

    expect(replayRes.status).toBe(400);
    expect(replayRes.body.error).toBe('Invalid authorization code');
  });

  it('The token exchange must bind the code to the issuing client', async () => {
    await request(app).post('/oauth/authorize').send({
      userId: validUUID,
      clientId: 'client-basic',
      scope: 'read',
      code_challenge: 'xyz',
      code_challenge_method: 'plain',
    });

    const stored = await prisma.oAuthAuthorizationCode.findFirst();

    const res = await request(app)
      .post('/oauth/token')
      .set('Authorization', 'Basic Y2xpZW50LXByaXZpbGVnZWQ6cHJpdmlsZWdlZC1zZWNyZXQ=')
      .send({
        code: stored?.code,
        code_verifier: 'xyz',
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('invalid_client');
  });

  it('Concurrent token exchanges should only succeed once per authorization code', async () => {
    await request(app).post('/oauth/authorize').send({
      userId: validUUID,
      clientId: 'client-basic',
      scope: 'read',
      code_challenge: 'same',
      code_challenge_method: 'plain',
    });

    const stored = await prisma.oAuthAuthorizationCode.findFirst();

    const results = await Promise.all([
      request(app)
        .post('/oauth/token')
        .send({ code: stored?.code, code_verifier: 'same', clientId: 'client-basic' }),
      request(app)
        .post('/oauth/token')
        .send({ code: stored?.code, code_verifier: 'same', clientId: 'client-basic' }),
      request(app)
        .post('/oauth/token')
        .send({ code: stored?.code, code_verifier: 'same', clientId: 'client-basic' }),
    ]);

    const successCount = results.filter((res) => res.status === 200).length;
    const failureCount = results.filter((res) => res.status === 400).length;

    expect(successCount).toBe(1);
    expect(failureCount).toBe(2);
  });
});

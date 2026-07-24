import request from 'supertest';
import app from '../../../src/app';
import { prisma } from '../../../src/db';
import { resetDatabase } from '../../setup';

const validUUID = '123e4567-e89b-12d3-a456-426614174000';

describe('OAuth refresh-token replay and rotation', () => {
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

  it('rotates refresh token and rejects replay', async () => {
    const authRes = await request(app)
      .post('/oauth/authorize')
      .send({ userId: validUUID, clientId: 'client-basic', scope: 'read' });

    const tokenRes = await request(app).post('/oauth/token').send({ code: authRes.body.code });

    const firstRefresh = await request(app)
      .post('/oauth/refresh')
      .send({ refresh_token: tokenRes.body.refresh_token, client_id: 'client-basic' });

    expect(firstRefresh.status).toBe(200);
    expect(firstRefresh.body.refresh_token).toBeDefined();
    expect(firstRefresh.body.refresh_token).not.toBe(tokenRes.body.refresh_token);

    const replay = await request(app)
      .post('/oauth/refresh')
      .send({ refresh_token: tokenRes.body.refresh_token, client_id: 'client-basic' });

    expect(replay.status).toBe(400);
    expect(replay.body.error).toBe('invalid_grant');
  });

  it('rejects refresh token when client does not match', async () => {
    const authRes = await request(app)
      .post('/oauth/authorize')
      .send({ userId: validUUID, clientId: 'client-basic', scope: 'read' });

    const tokenRes = await request(app).post('/oauth/token').send({ code: authRes.body.code });

    const wrongClient = await request(app)
      .post('/oauth/refresh')
      .send({ refresh_token: tokenRes.body.refresh_token, client_id: 'client-privileged' });

    expect(wrongClient.status).toBe(400);
    expect(wrongClient.body.error).toBe('invalid_grant');
  });
});

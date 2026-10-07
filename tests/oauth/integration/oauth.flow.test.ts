import request from 'supertest';
import app from '../../../src/app';
import { prisma } from '../../../src/db';
import { resetDatabase } from '../../setup'; // ⭐ Use global reset
import { APP_CONFIG } from '../../../src/config';
import { createPkcePair } from '../../../src/oauth/pkce';
import { hashOpaqueToken } from '../../../src/oauth/oauth.service';

const validUUID = '123e4567-e89b-12d3-a456-426614174000';

describe('OAuth Integration Flow', () => {
  beforeEach(async () => {
    jest.clearAllMocks();

    // ⭐ Global DB reset (correct FK order + OAuth client recreated)
    await resetDatabase();

    // ⭐ Recreate base user (resetDatabase should NOT create users)
    await prisma.user.create({
      data: {
        id: validUUID,
        email: 'test@example.com',
        password: 'hashed-password',
      },
    });
  });

  // -----------------------------------------------------
  // AUTHORIZE → RETURNS CODE
  // -----------------------------------------------------
  it('POST /oauth/authorize → returns authorization code for valid user', async () => {
    const res = await request(app).post('/oauth/authorize').send({
      userId: validUUID,
      clientId: 'client-basic',
      scope: 'read',
    });

    expect(res.status).toBe(200);

    const stored = await prisma.oAuthAuthorizationCode.findFirst();

    expect(res.body).toEqual({
      code: stored?.code,
      state: stored?.state ?? null,
    });
  });

  // -----------------------------------------------------
  // TOKEN → RETURNS JWT
  // -----------------------------------------------------
  it('POST /oauth/token → returns opaque bearer tokens for a valid authorization code', async () => {
    // Step 1: generate code
    await request(app).post('/oauth/authorize').send({
      userId: validUUID,
      clientId: 'client-basic',
      scope: 'read',
    });

    const stored = await prisma.oAuthAuthorizationCode.findFirst();

    // Step 2: exchange code
    const res = await request(app).post('/oauth/token').send({ code: stored?.code });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('access_token');
    expect(res.body).toHaveProperty('refresh_token');
    expect(res.body).toHaveProperty('token_type', 'Bearer');
    expect(res.body).toHaveProperty('expires_in');
  });

  it('stores hashed tokens, introspects and rotates refresh tokens, and enforces refresh expiry', async () => {
    const { code_verifier, code_challenge } = await createPkcePair();
    const authorize = await request(app).post('/oauth/authorize').send({
      userId: validUUID,
      clientId: 'client-basic',
      scope: 'read',
      state: 'audit-state',
      code_challenge,
      code_challenge_method: 'S256',
    });
    expect(authorize.status).toBe(200);

    const issued = await request(app).post('/oauth/token').send({
      code: authorize.body.code,
      clientId: 'client-basic',
      state: 'audit-state',
      code_verifier,
    });
    expect(issued.status).toBe(200);
    expect(issued.body.expires_in).toBe(APP_CONFIG.oauth.accessTokenTtlSeconds);

    let stored = await prisma.oAuthAccessToken.findUnique({
      where: { accessToken: hashOpaqueToken(issued.body.access_token) },
    });
    expect(stored).not.toBeNull();
    expect(stored?.accessToken).not.toBe(issued.body.access_token);
    expect(stored?.refreshToken).toBe(hashOpaqueToken(issued.body.refresh_token));
    expect(stored?.refreshExpiresAt.getTime()).toBeGreaterThan(stored?.expiresAt.getTime() ?? 0);

    const missingClientInfo = await request(app).post('/oauth/introspect').send({ token: issued.body.refresh_token });
    expect(missingClientInfo.status).toBe(400);
    expect(missingClientInfo.body.error).toBe('invalid_client');

    const wrongClientInfo = await request(app).post('/oauth/introspect').send({
      token: issued.body.refresh_token,
      clientId: 'client-admin',
    });
    expect(wrongClientInfo.body).toEqual({ active: false });

    const refreshInfo = await request(app).post('/oauth/introspect').send({
      token: issued.body.refresh_token,
      clientId: 'client-basic',
    });
    expect(refreshInfo.body).toMatchObject({ active: true, token_type: 'refresh_token', client_id: 'client-basic' });
    expect(refreshInfo.body.exp).toBe(Math.floor((stored?.refreshExpiresAt.getTime() ?? 0) / 1000));

    const rotated = await request(app).post('/oauth/refresh').send({
      refresh_token: issued.body.refresh_token,
      clientId: 'client-basic',
    });
    expect(rotated.status).toBe(200);
    expect(rotated.body.expires_in).toBe(APP_CONFIG.oauth.accessTokenTtlSeconds);

    stored = await prisma.oAuthAccessToken.findUnique({
      where: { accessToken: hashOpaqueToken(rotated.body.access_token) },
    });
    expect(stored?.refreshToken).toBe(hashOpaqueToken(rotated.body.refresh_token));

    await prisma.oAuthAccessToken.update({
      where: { accessToken: hashOpaqueToken(rotated.body.access_token) },
      data: { refreshExpiresAt: new Date(Date.now() - 1000) },
    });
    const expiredRefreshInfo = await request(app).post('/oauth/introspect').send({
      token: rotated.body.refresh_token,
      clientId: 'client-basic',
    });
    expect(expiredRefreshInfo.body).toMatchObject({ active: false, token_type: 'refresh_token' });

    const expiredRefresh = await request(app).post('/oauth/refresh').send({
      refresh_token: rotated.body.refresh_token,
      clientId: 'client-basic',
    });
    expect(expiredRefresh.status).toBe(400);
    expect(expiredRefresh.body.error).toBe('invalid_grant');

    const wrongClientRevoke = await request(app).post('/oauth/revoke').send({
      token: rotated.body.refresh_token,
      clientId: 'client-admin',
    });
    expect(wrongClientRevoke.status).toBe(200);
    expect(await prisma.oAuthAccessToken.findUnique({
      where: { refreshToken: hashOpaqueToken(rotated.body.refresh_token) },
    })).not.toBeNull();

    const correctClientRevoke = await request(app).post('/oauth/revoke').send({
      token: rotated.body.refresh_token,
      clientId: 'client-basic',
    });
    expect(correctClientRevoke.status).toBe(200);
    expect(await prisma.oAuthAccessToken.findUnique({
      where: { refreshToken: hashOpaqueToken(rotated.body.refresh_token) },
    })).toBeNull();
  });

  // -----------------------------------------------------
  // PROTECTED ROUTE → MISSING HEADER
  // -----------------------------------------------------
  it('GET /oauth/protected → rejects missing Authorization header', async () => {
    const res = await request(app).get('/oauth/protected');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Missing Authorization header' });
  });

  // -----------------------------------------------------
  // PROTECTED ROUTE → INVALID JWT
  // -----------------------------------------------------
  it('GET /oauth/protected → rejects invalid JWT', async () => {
    const res = await request(app)
      .get('/oauth/protected')
      .set('Authorization', 'Bearer invalid.jwt.token');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid or expired token' });
  });

  // -----------------------------------------------------
  // PROTECTED ROUTE → VALID JWT
  // -----------------------------------------------------
  it('GET /oauth/protected → accepts valid JWT', async () => {
    jest
      .spyOn(require('../../../src/oauth/oauth.service'), 'validateAccessToken')
      .mockResolvedValue({ userId: validUUID });

    const res = await request(app)
      .get('/oauth/protected')
      .set('Authorization', 'Bearer valid.jwt.token');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: 'Protected resource accessed',
      user_id: validUUID,
    });
  });
});

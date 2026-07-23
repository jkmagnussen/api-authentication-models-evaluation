```typescript
import express, { Request, Response, Router } from 'express';
import crypto from 'crypto';

const oauthRouter = Router();

// In-memory stores (replace with database in production)
const authorizationCodes = new Map<string, {
  clientId: string;
  redirectUri: string;
  scope: string;
  expiresAt: number;
  userId: string;
}>();

const clientRegistry = new Map<string, {
  clientSecret: string;
  redirectUris: string[];
  name: string;
}>();

const accessTokens = new Map<string, {
  clientId: string;
  userId: string;
  scope: string;
  expiresAt: number;
}>();

// Initialize with sample client
clientRegistry.set('sample-client-xyz', {
  clientSecret: 'super-secret-key-789',
  redirectUris: ['http://localhost:3001/callback'],
  name: 'Sample OAuth Client'
});

function generateAuthCode(): string {
  return crypto.randomBytes(32).toString('hex');
}

function generateAccessToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Authorization endpoint - user grants permission
oauthRouter.get('/authorize', (req: Request, res: Response) => {
  const { client_id, redirect_uri, scope, state, response_type } = req.query;

  // Validate client
  if (!clientRegistry.has(client_id as string)) {
    return res.status(400).json({ error: 'invalid_client' });
  }

  const client = clientRegistry.get(client_id as string)!;

  // Validate redirect_uri
  if (!client.redirectUris.includes(redirect_uri as string)) {
    return res.status(400).json({ error: 'invalid_redirect_uri' });
  }

  if (response_type !== 'code') {
    return res.status(400).json({ error: 'unsupported_response_type' });
  }

  // In a real app, show a login/consent form here
  // For this sample, we'll simulate user consent with a test user
  const userId = 'user-test-123';
  const authCode = generateAuthCode();
  const expiryTime = Date.now() + 10 * 60 * 1000; // 10 minutes

  authorizationCodes.set(authCode, {
    clientId: client_id as string,
    redirectUri: redirect_uri as string,
    scope: (scope as string) || 'openid profile',
    expiresAt: expiryTime,
    userId
  });

  // Redirect back to client with authorization code
  const redirectParams = new URLSearchParams({
    code: authCode,
    state: (state as string) || ''
  });

  res.redirect(`${redirect_uri}?${redirectParams.toString()}`);
});

// Token endpoint - exchange authorization code for access token
oauthRouter.post('/token', (req: Request, res: Response) => {
  const { grant_type, code, client_id, client_secret, redirect_uri } = req.body;

  if (grant_type !== 'authorization_code') {
    return res.status(400).json({ error: 'unsupported_grant_type' });
  }

  // Validate client credentials
  if (!clientRegistry.has(client_id)) {
    return res.status(401).json({ error: 'invalid_client' });
  }

  const client = clientRegistry.get(client_id)!;
  if (client.clientSecret !== client_secret) {
    return res.status(401
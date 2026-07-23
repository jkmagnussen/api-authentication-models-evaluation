```typescript
import express, { Request, Response } from 'express';
import crypto from 'crypto';

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

interface AuthorizationRequest {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  state: string;
  nonce?: string;
}

interface StoredAuthCode {
  code: string;
  clientId: string;
  redirectUri: string;
  scope: string;
  expiresAt: number;
  userId: string;
}

interface TokenRequest {
  grant_type: string;
  code: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
}

interface AccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

// In-memory storage for demo purposes
const registeredClients = new Map<string, { secret: string; redirectUris: string[] }>([
  ['client_demo_123', { secret: 'secret_abc_789', redirectUris: ['http://localhost:3001/callback'] }],
]);

const issuedAuthCodes = new Map<string, StoredAuthCode>();
const issuedTokens = new Map<string, { userId: string; scope: string; expiresAt: number }>();

function generateSecureCode(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

function validateClientCredentials(clientId: string, clientSecret: string): boolean {
  const client = registeredClients.get(clientId);
  return client ? client.secret === clientSecret : false;
}

function validateRedirectUri(clientId: string, redirectUri: string): boolean {
  const client = registeredClients.get(clientId);
  return client ? client.redirectUris.includes(redirectUri) : false;
}

export async function handleAuthorizationRequest(req: Request, res: Response): Promise<void> {
  const authReq: AuthorizationRequest = {
    client_id: req.query.client_id as string,
    redirect_uri: req.query.redirect_uri as string,
    response_type: req.query.response_type as string,
    scope: req.query.scope as string,
    state: req.query.state as string,
    nonce: req.query.nonce as string,
  };

  // Validate required parameters
  if (!authReq.client_id || !authReq.redirect_uri || !authReq.response_type) {
    res.status(400).json({ error: 'invalid_request', error_description: 'Missing required parameters' });
    return;
  }

  // Validate client
  if (!registeredClients.has(authReq.client_id)) {
    res.status(401).json({ error: 'invalid_client', error_description: 'Unknown client' });
    return;
  }

  // Validate redirect URI
  if (!validateRedirectUri(authReq.client_id, authReq.redirect_uri)) {
    res.status(400).json({ error: 'invalid_request', error_description: 'Invalid redirect URI' });
    return;
  }

  // Only support authorization code flow
  if (authReq.response_type !== 'code') {
    const redirectUrl = new URL(authReq.redirect_uri);
    redirectUrl.searchParams.append('error', 'unsupported_response_type');
    redirectUrl
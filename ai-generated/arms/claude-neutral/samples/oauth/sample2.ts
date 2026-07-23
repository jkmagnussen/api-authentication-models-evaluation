```typescript
import express, { Request, Response } from 'express';
import crypto from 'crypto';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

interface AuthorizationRequest {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  state: string;
}

interface StoredClient {
  client_id: string;
  client_secret: string;
  redirect_uris: string[];
  name: string;
}

const registeredClients: Map<string, StoredClient> = new Map([
  ['mobile_app_001', {
    client_id: 'mobile_app_001',
    client_secret: 'secret_mobile_12345',
    redirect_uris: ['https://app.example.com/callback'],
    name: 'Mobile Application'
  }],
  ['web_service_002', {
    client_id: 'web_service_002',
    client_secret: 'secret_web_67890',
    redirect_uris: ['http://localhost:3001/oauth/callback', 'https://service.example.com/auth/callback'],
    name: 'Web Service'
  }]
]);

const pendingAuthorizations: Map<string, AuthorizationRequest & { expiresAt: number }> = new Map();
const issuedTokens: Map<string, { client_id: string; scope: string; expiresAt: number }> = new Map();

export function validateRedirectUri(clientId: string, redirectUri: string): boolean {
  const client = registeredClients.get(clientId);
  if (!client) return false;
  return client.redirect_uris.includes(redirectUri);
}

export function generateAuthorizationCode(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateAccessToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function handleAuthorizationInitiate(req: Request, res: Response): void {
  const { client_id, redirect_uri, response_type, scope, state } = req.query;

  if (!client_id || typeof client_id !== 'string') {
    res.status(400).json({ error: 'invalid_request', error_description: 'Missing client_id' });
    return;
  }

  if (!redirect_uri || typeof redirect_uri !== 'string') {
    res.status(400).json({ error: 'invalid_request', error_description: 'Missing redirect_uri' });
    return;
  }

  if (!registeredClients.has(client_id)) {
    res.status(401).json({ error: 'invalid_client', error_description: 'Unknown client_id' });
    return;
  }

  if (!validateRedirectUri(client_id, redirect_uri)) {
    res.status(403).json({ error: 'invalid_grant', error_description: 'Invalid redirect_uri' });
    return;
  }

  if (response_type !== 'code') {
    const params = new URLSearchParams({
      error: 'unsupported_response_type',
      state: state ? String(state) : ''
    });
    res.redirect(`${redirect_uri}?${params.toString()}`);
    return;
  }

  const authCode = generateAuthorizationCode();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  pendingAuthorizations.set(authCode, {
    client_id: client_id as string,
```typescript
import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import querystring from 'querystring';

interface AuthorizationRequest {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  state: string;
  code_challenge?: string;
  code_challenge_method?: string;
}

interface StoredAuthCode {
  code: string;
  client_id: string;
  redirect_uri: string;
  scope: string;
  user_id: string;
  expires_at: number;
  code_challenge?: string;
  code_challenge_method?: string;
}

interface ClientRegistry {
  [key: string]: {
    client_secret: string;
    redirect_uris: string[];
    allowed_scopes: string[];
  };
}

const authorizationCodes: Map<string, StoredAuthCode> = new Map();
const tokenStorage: Map<string, {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  scope: string;
}> = new Map();

const registeredClients: ClientRegistry = {
  'sample-client-id': {
    client_secret: 'sample-client-secret-123',
    redirect_uris: ['http://localhost:3001/callback', 'https://example.com/callback'],
    allowed_scopes: ['read', 'write', 'profile']
  },
  'mobile-app-client': {
    client_secret: 'mobile-app-secret-456',
    redirect_uris: ['myapp://oauth/callback'],
    allowed_scopes: ['read', 'profile', 'email']
  }
};

function validateClientExists(clientId: string): boolean {
  return clientId in registeredClients;
}

function validateRedirectUri(clientId: string, redirectUri: string): boolean {
  const client = registeredClients[clientId];
  if (!client) return false;
  return client.redirect_uris.includes(redirectUri);
}

function validateScopesForClient(clientId: string, requestedScopes: string): boolean {
  const client = registeredClients[clientId];
  if (!client) return false;
  const scopes = requestedScopes.split(' ');
  return scopes.every(scope => client.allowed_scopes.includes(scope));
}

function generateAuthorizationCode(): string {
  return crypto.randomBytes(32).toString('hex');
}

function generateAccessToken(): string {
  return 'bearer_' + crypto.randomBytes(32).toString('hex');
}

function generateRefreshToken(): string {
  return 'refresh_' + crypto.randomBytes(32).toString('hex');
}

function storeAuthorizationCode(
  code: string,
  clientId: string,
  redirectUri: string,
  scope: string,
  userId: string,
  codeChallenge?: string,
  codeChallengeMethod?: string
): void {
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  authorizationCodes.set(code, {
    code,
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    user_id: userId,
    expires_at: expiresAt,
    code_challenge: codeChallenge,
    code_challenge_method: codeChallengeMethod
  });
}

function retrieveAndInvalidateAuthCode(code: string): StoredAuthCode | null {
  const authCode = auth
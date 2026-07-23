```typescript
import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

interface OAuthClient {
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  allowedScopes: string[];
  grantTypes: string[];
}

interface AuthorizationSession {
  sessionId: string;
  clientId: string;
  requestedScopes: string[];
  redirectUri: string;
  userId: string | null;
  approved: boolean;
  expiresAt: number;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}

const registeredClients: Map<string, OAuthClient> = new Map();
const authorizationSessions: Map<string, AuthorizationSession> = new Map();
const issuedAuthorizationCodes: Map<string, AuthorizationSession> = new Map();

// Sample client registration
registeredClients.set('sample_client_001', {
  clientId: 'sample_client_001',
  clientSecret: 'very_secure_secret_key_12345',
  redirectUris: ['http://localhost:3001/callback', 'http://localhost:3001/oauth/callback'],
  allowedScopes: ['profile', 'email', 'openid', 'offline_access'],
  grantTypes: ['authorization_code', 'refresh_token'],
});

export function validateClientCredentials(
  clientId: string,
  clientSecret: string
): boolean {
  const client = registeredClients.get(clientId);
  return client ? client.clientSecret === clientSecret : false;
}

export function verifyRedirectUri(clientId: string, redirectUri: string): boolean {
  const client = registeredClients.get(clientId);
  return client ? client.redirectUris.includes(redirectUri) : false;
}

export function validateRequestedScopes(clientId: string, scopes: string[]): boolean {
  const client = registeredClients.get(clientId);
  if (!client) return false;
  return scopes.every((scope) => client.allowedScopes.includes(scope));
}

export function generateAuthorizationCode(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateSessionId(): string {
  return 'session_' + crypto.randomBytes(16).toString('hex');
}

export function initializeAuthorizationFlow(
  clientId: string,
  redirectUri: string,
  requestedScopes: string[],
  codeChallenge?: string,
  codeChallengeMethod?: string
): string | null {
  if (!verifyRedirectUri(clientId, redirectUri)) {
    return null;
  }

  if (!validateRequestedScopes(clientId, requestedScopes)) {
    return null;
  }

  const sessionId = generateSessionId();
  const session: AuthorizationSession = {
    sessionId,
    clientId,
    requestedScopes,
    redirectUri,
    userId: null,
    approved: false,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    codeChallenge,
    codeChallengeMethod,
  };

  authorizationSessions.set(sessionId, session);
  return sessionId;
}

export function approveAuthorizationSession(
  sessionId: string,
  userId: string
): string | null {
  const session = authorizationSessions.get(session
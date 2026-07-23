```typescript
import express, { Request, Response, Router } from 'express';
import crypto from 'crypto';
import { URL } from 'url';

const authRouter = Router();

interface AuthorizationRequest {
  clientId: string;
  redirectUri: string;
  scope: string[];
  state: string;
  responseType: string;
}

interface StoredAuthSession {
  clientId: string;
  redirectUri: string;
  scope: string[];
  state: string;
  expiresAt: number;
  nonce?: string;
}

interface ClientConfig {
  id: string;
  secret: string;
  redirectUris: string[];
  allowedScopes: string[];
  name: string;
}

const VALID_RESPONSE_TYPES = ['code', 'token'];
const VALID_SCOPES = ['openid', 'profile', 'email', 'offline_access'];
const SESSION_TIMEOUT_MS = 10 * 60 * 1000;
const STATE_LENGTH = 32;

const registeredClients: Map<string, ClientConfig> = new Map([
  [
    'secure-client-001',
    {
      id: 'secure-client-001',
      secret: 'client_secret_key_here',
      redirectUris: [
        'https://app.example.com/callback',
        'https://app.example.com/auth/callback',
      ],
      allowedScopes: ['openid', 'profile', 'email'],
      name: 'Example Application',
    },
  ],
]);

const authorizationSessions = new Map<string, StoredAuthSession>();

export function validateRedirectUri(
  clientId: string,
  redirectUri: string
): boolean {
  const client = registeredClients.get(clientId);
  if (!client) {
    return false;
  }

  try {
    const parsedUri = new URL(redirectUri);

    if (!parsedUri.protocol.startsWith('https')) {
      return false;
    }

    return client.redirectUris.some((allowedUri) => allowedUri === redirectUri);
  } catch {
    return false;
  }
}

export function validateScopes(
  clientId: string,
  requestedScopes: string[]
): boolean {
  const client = registeredClients.get(clientId);
  if (!client || !Array.isArray(requestedScopes)) {
    return false;
  }

  if (requestedScopes.length === 0) {
    return false;
  }

  return requestedScopes.every((scope) => {
    return (
      VALID_SCOPES.includes(scope) && client.allowedScopes.includes(scope)
    );
  });
}

export function generateSecureState(): string {
  return crypto.randomBytes(STATE_LENGTH).toString('hex');
}

export function createAuthorizationSession(
  clientId: string,
  redirectUri: string,
  scope: string[],
  state: string
): string {
  const sessionId = crypto.randomBytes(16).toString('hex');
  const session: StoredAuthSession = {
    clientId,
    redirectUri,
    scope,
    state,
    expiresAt: Date.now() + SESSION_TIMEOUT_MS,
  };

  authorizationSessions.set(sessionId, session);
  return sessionId;
}

export function retrieveAuthSession(sessionId: string): StoredAuthSession | null {
  const session = authorizationSessions.get(sessionId);

  if (!session) {
    return null;
  }

  if (Date.now() > session
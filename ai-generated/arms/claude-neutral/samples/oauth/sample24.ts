```typescript
import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const app = express();

interface ClientConfig {
  clientId: string;
  redirectUris: string[];
  allowedScopes: string[];
}

interface AuthorizationRequest {
  clientId: string;
  redirectUri: string;
  scopes: string[];
  state: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}

const registeredClients: Map<string, ClientConfig> = new Map([
  [
    'secure-client-123',
    {
      clientId: 'secure-client-123',
      redirectUris: ['https://client.example.com/callback', 'https://client.example.com/auth/callback'],
      allowedScopes: ['read:profile', 'write:data', 'openid', 'email'],
    },
  ],
]);

const authorizationSessions: Map<string, AuthorizationRequest> = new Map();

function validateRedirectUri(clientId: string, redirectUri: string): boolean {
  const client = registeredClients.get(clientId);
  if (!client) return false;

  try {
    const parsedUri = new URL(redirectUri);

    if (!parsedUri.protocol.startsWith('https://') && parsedUri.hostname !== 'localhost') {
      return false;
    }

    return client.redirectUris.some((allowedUri) => {
      const allowedUrl = new URL(allowedUri);
      return (
        allowedUrl.protocol === parsedUri.protocol &&
        allowedUrl.hostname === parsedUri.hostname &&
        allowedUrl.pathname === parsedUri.pathname
      );
    });
  } catch {
    return false;
  }
}

function validateScopes(clientId: string, requestedScopes: string[]): boolean {
  const client = registeredClients.get(clientId);
  if (!client) return false;

  const normalizedScopes = requestedScopes.map((s) => s.trim()).filter((s) => s.length > 0);

  if (normalizedScopes.length === 0) {
    return false;
  }

  return normalizedScopes.every((scope) => client.allowedScopes.includes(scope));
}

function generateState(): string {
  return crypto.randomBytes(32).toString('hex');
}

function validateStateParameter(state: string): boolean {
  if (!state || typeof state !== 'string') {
    return false;
  }

  if (state.length < 32 || state.length > 500) {
    return false;
  }

  return /^[a-zA-Z0-9\-._~]*$/.test(state);
}

function validateCodeChallenge(codeChallenge: string | undefined, method: string | undefined): boolean {
  if (!codeChallenge) {
    return true;
  }

  if (codeChallenge.length < 43 || codeChallenge.length > 128) {
    return false;
  }

  if (!/^[A-Za-z0-9\-._~]*$/.test(codeChallenge)) {
    return false;
  }

  const validMethods = ['S256', 'plain'];
  return !method || validMethods.includes(method);
}

function buildAuthorizationError(
  redirectUri: string,
  error: string,
  description: string,
  state?: string,
): string {
  const url = new URL(redirectUri);
  url.searchParams.append('error', error);
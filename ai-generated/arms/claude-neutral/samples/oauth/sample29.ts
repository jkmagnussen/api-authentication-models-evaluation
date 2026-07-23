```typescript
import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

interface AuthorizationRequest {
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  responseType: string;
}

interface StoredClient {
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  allowedScopes: string[];
}

interface PendingAuthorization {
  code: string;
  clientId: string;
  redirectUri: string;
  scope: string;
  expiresAt: number;
  userId?: string;
}

const registeredClients: Map<string, StoredClient> = new Map([
  [
    'app-123',
    {
      clientId: 'app-123',
      clientSecret: 'secret-xyz-789',
      redirectUris: ['http://localhost:3001/callback'],
      allowedScopes: ['read', 'write', 'profile']
    }
  ]
]);

const pendingAuthorizations: Map<string, PendingAuthorization> = new Map();
const issuedTokens: Map<string, { accessToken: string; scope: string; userId: string; expiresAt: number }> = new Map();

export const generateRandomCode = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

export const validateClientId = (clientId: string): StoredClient | null => {
  return registeredClients.get(clientId) || null;
};

export const validateRedirectUri = (client: StoredClient, redirectUri: string): boolean => {
  return client.redirectUris.includes(redirectUri);
};

export const validateScope = (client: StoredClient, scope: string): boolean => {
  const requestedScopes = scope.split(' ');
  return requestedScopes.every(s => client.allowedScopes.includes(s));
};

export const storeAuthorizationCode = (clientId: string, redirectUri: string, scope: string): string => {
  const code = generateRandomCode();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  pendingAuthorizations.set(code, {
    code,
    clientId,
    redirectUri,
    scope,
    expiresAt
  });

  setTimeout(() => pendingAuthorizations.delete(code), 10 * 60 * 1000);

  return code;
};

export const getAuthorizationCode = (code: string): PendingAuthorization | null => {
  const auth = pendingAuthorizations.get(code);
  if (!auth || auth.expiresAt < Date.now()) {
    pendingAuthorizations.delete(code);
    return null;
  }
  return auth;
};

export const authorizeRequest = (code: string, userId: string): void => {
  const auth = pendingAuthorizations.get(code);
  if (auth) {
    auth.userId = userId;
  }
};

export const exchangeCodeForToken = (code: string, clientId: string, clientSecret: string): { accessToken: string; tokenType: string; expiresIn: number } | null => {
  const auth = getAuthorizationCode(code);
  if (!auth || auth.clientId !== clientId) {
    return null;
  }

  const client = validateClientId(clientId);
  if (!client || client.clientSecret !== clientSecret) {
    return null;
  }

  if (!auth.userId) {
    return null;
  }
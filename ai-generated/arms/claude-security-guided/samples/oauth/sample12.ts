```typescript
import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { URL } from 'url';

const app = express();

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUris: Set<string>;
  allowedScopes: Set<string>;
  stateExpiry: number;
}

interface StateRecord {
  timestamp: number;
  clientId: string;
  requestedScopes: string[];
  nonce?: string;
}

const oauthConfig: OAuthConfig = {
  clientId: 'sample-client-id',
  clientSecret: 'sample-client-secret',
  redirectUris: new Set([
    'https://app.example.com/callback',
    'https://app.example.com/oauth/return',
  ]),
  allowedScopes: new Set(['openid', 'profile', 'email', 'offline_access']),
  stateExpiry: 600000,
};

const stateStore = new Map<string, StateRecord>();

function generateSecureState(): string {
  return crypto.randomBytes(32).toString('hex');
}

function validateRedirectUri(
  redirectUri: string,
  allowedUris: Set<string>
): boolean {
  if (!redirectUri) {
    return false;
  }

  try {
    const parsedUrl = new URL(redirectUri);

    if (!parsedUrl.protocol.startsWith('https')) {
      return false;
    }

    if (
      parsedUrl.hostname === 'localhost' ||
      parsedUrl.hostname === '127.0.0.1'
    ) {
      return allowedUris.has(redirectUri);
    }

    return allowedUris.has(redirectUri);
  } catch {
    return false;
  }
}

function validateScopes(
  requestedScopes: string[],
  allowedScopes: Set<string>
): boolean {
  if (!Array.isArray(requestedScopes) || requestedScopes.length === 0) {
    return false;
  }

  return requestedScopes.every((scope) => allowedScopes.has(scope));
}

function validateClientId(clientId: string): boolean {
  return clientId === oauthConfig.clientId;
}

function storeAuthorizationState(
  state: string,
  clientId: string,
  scopes: string[],
  nonce?: string
): void {
  stateStore.set(state, {
    timestamp: Date.now(),
    clientId,
    requestedScopes: scopes,
    nonce,
  });
}

function retrieveAndValidateState(state: string): StateRecord | null {
  const record = stateStore.get(state);

  if (!record) {
    return null;
  }

  const now = Date.now();
  if (now - record.timestamp > oauthConfig.stateExpiry) {
    stateStore.delete(state);
    return null;
  }

  return record;
}

function clearState(state: string): void {
  stateStore.delete(state);
}

async function authorizationEndpoint(
  req: Request,
  res: Response
): Promise<void> {
  const {
    client_id,
    redirect_uri,
    scope,
    state,
    response_type,
    nonce,
  } = req.query;

  const errors: string[] = [];

  if (!client_id || typeof client_id !== 'string') {
    errors.push('missing_client_id');
  } else if (!
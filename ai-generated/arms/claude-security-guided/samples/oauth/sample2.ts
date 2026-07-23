```typescript
import express, { Request, Response } from 'express';
import crypto from 'crypto';
import url from 'url';

const app = express();

interface AuthorizationParams {
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  responseType: string;
}

interface StoredAuthRequest {
  clientId: string;
  redirectUri: string;
  scope: string;
  timestamp: number;
  userId?: string;
}

const VALID_SCOPES = new Set(['read', 'write', 'profile', 'email', 'openid']);
const VALID_RESPONSE_TYPES = new Set(['code', 'token']);
const AUTHORIZED_CLIENTS = new Map([
  ['client_web_app', 'https://localhost:3001/callback'],
  ['client_mobile', 'https://mobile.example.com/oauth/callback'],
  ['client_spa', 'http://localhost:3000/auth/callback'],
]);

const authorizationStates = new Map<string, StoredAuthRequest>();
const STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

function validateClientId(clientId: string): boolean {
  return AUTHORIZED_CLIENTS.has(clientId);
}

function validateRedirectUri(clientId: string, redirectUri: string): boolean {
  if (!validateClientId(clientId)) {
    return false;
  }

  const allowedUri = AUTHORIZED_CLIENTS.get(clientId);
  if (!allowedUri) {
    return false;
  }

  try {
    const parsedProvided = new URL(redirectUri);
    const parsedAllowed = new URL(allowedUri);

    return (
      parsedProvided.protocol === parsedAllowed.protocol &&
      parsedProvided.hostname === parsedAllowed.hostname &&
      parsedProvided.pathname === parsedAllowed.pathname
    );
  } catch {
    return false;
  }
}

function validateScopes(scopes: string): boolean {
  if (!scopes || scopes.trim().length === 0) {
    return false;
  }

  const requestedScopes = scopes.split(' ').map(s => s.trim());
  if (requestedScopes.length === 0) {
    return false;
  }

  return requestedScopes.every(scope => VALID_SCOPES.has(scope));
}

function generateStateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function validateAndParseParams(query: Record<string, string | string[] | undefined>): 
  { valid: true; params: AuthorizationParams } | { valid: false; error: string } {
  
  const clientId = query.client_id;
  const redirectUri = query.redirect_uri;
  const scope = query.scope;
  const state = query.state;
  const responseType = query.response_type;

  if (!clientId || typeof clientId !== 'string' || clientId.length === 0) {
    return { valid: false, error: 'Missing or invalid client_id' };
  }

  if (!redirectUri || typeof redirectUri !== 'string' || redirectUri.length === 0) {
    return { valid: false, error: 'Missing or invalid redirect_uri' };
  }

  if (!scope || typeof scope !== 'string') {
    return { valid: false, error: 'Missing or invalid scope' };
  }

  if (!state || typeof state !== 'string' || state.length < 20) {
    return { valid: false, error: '
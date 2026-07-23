```typescript
import express, { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const oauthRouter = Router();

interface AuthorizationRequest {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  state: string;
  code_challenge?: string;
  code_challenge_method?: string;
}

interface StoredAuthState {
  client_id: string;
  redirect_uri: string;
  scope: string;
  code_challenge?: string;
  code_challenge_method?: string;
  created_at: number;
  expires_at: number;
}

const ALLOWED_RESPONSE_TYPES = ['code', 'token'];
const VALID_SCOPES = ['read', 'write', 'delete', 'admin'];
const STATE_EXPIRY_MS = 10 * 60 * 1000;
const REDIRECT_TIMEOUT_MS = 5 * 60 * 1000;

const registeredClients: Map<string, { redirect_uris: string[]; secret: string }> = new Map([
  ['client_sample_25', { redirect_uris: ['http://localhost:3001/callback', 'https://app.example.com/oauth/callback'], secret: 'super_secret_key_25' }],
  ['trusted_client', { redirect_uris: ['https://trusted.example.com/auth/callback'], secret: 'trusted_secret' }],
]);

const stateStore: Map<string, StoredAuthState> = new Map();

function validateRedirectUri(clientId: string, redirectUri: string): boolean {
  const client = registeredClients.get(clientId);
  if (!client) {
    return false;
  }

  try {
    const requestedUrl = new URL(redirectUri);
    return client.redirect_uris.some(uri => {
      try {
        const registeredUrl = new URL(uri);
        return requestedUrl.origin === registeredUrl.origin && requestedUrl.pathname === registeredUrl.pathname;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

function validateScopes(requestedScopes: string[]): boolean {
  return requestedScopes.length > 0 && requestedScopes.every(scope => VALID_SCOPES.includes(scope));
}

function generateSecureState(): string {
  return crypto.randomBytes(32).toString('hex');
}

function generateAuthorizationCode(): string {
  return crypto.randomBytes(24).toString('hex');
}

function validateStateParameter(state: string): boolean {
  if (!state || state.length < 32) {
    return false;
  }
  
  return /^[a-f0-9]{64}$/.test(state);
}

export const authorizationEndpoint = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { client_id, redirect_uri, response_type, scope, state, code_challenge, code_challenge_method } = req.query as Record<string, string>;

    const errors: string[] = [];

    if (!client_id || typeof client_id !== 'string') {
      errors.push('missing_client_id');
    }

    if (!redirect_uri || typeof redirect_uri !== 'string') {
      errors.push('missing_redirect_uri');
    }

    if (!response_type || typeof response_type !== 'string' || !ALLOWED_RESPONSE_TYPES.includes(response_type)) {
      errors.push('invalid_response_
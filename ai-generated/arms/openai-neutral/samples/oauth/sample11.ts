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
  scope: string[];
  state: string;
  responseType: string;
}

const registeredClients: Map<string, ClientConfig> = new Map([
  ['client_123', {
    clientId: 'client_123',
    redirectUris: ['https://app.example.com/callback', 'https://localhost:3001/callback'],
    allowedScopes: ['profile', 'email', 'openid']
  }]
]);

const validateUrl = (urlString: string): boolean => {
  try {
    const url = new URL(urlString);
    return url.protocol === 'https:' || (url.hostname === 'localhost' && url.protocol === 'http:');
  } catch {
    return false;
  }
};

const validateRedirectUri = (clientId: string, redirectUri: string): boolean => {
  const client = registeredClients.get(clientId);
  if (!client) return false;
  
  if (!validateUrl(redirectUri)) return false;
  
  return client.redirectUris.includes(redirectUri);
};

const validateRequestedScopes = (clientId: string, requestedScopes: string[]): boolean => {
  const client = registeredClients.get(clientId);
  if (!client) return false;
  
  return requestedScopes.length > 0 && 
         requestedScopes.every(scope => client.allowedScopes.includes(scope));
};

const parseAuthorizationRequest = (query: any): AuthorizationRequest | null => {
  const { client_id, redirect_uri, scope, state, response_type } = query;
  
  if (!client_id || typeof client_id !== 'string') return null;
  if (!redirect_uri || typeof redirect_uri !== 'string') return null;
  if (!scope || typeof scope !== 'string') return null;
  if (!state || typeof state !== 'string') return null;
  if (response_type !== 'code') return null;
  
  const scopes = scope.split(' ').filter((s: string) => s.length > 0);
  if (scopes.length === 0) return null;
  
  if (state.length < 16 || state.length > 256) return null;
  
  return {
    clientId: client_id,
    redirectUri: redirect_uri,
    scope: scopes,
    state: state,
    responseType: response_type
  };
};

const generateAuthorizationCode = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

const authorizationCache = new Map<string, { request: AuthorizationRequest; expiresAt: number }>();

export const validateAuthorizationRequest = (req: Request, res: Response, next: NextFunction): void => {
  const authReq = parseAuthorizationRequest(req.query);
  
  if (!authReq) {
    res.status(400).json({
      error: 'invalid_request',
      error_description: 'Missing or invalid required parameters'
    });
    return;
  }
  
  if (!registeredClients.has(authReq.clientId)) {
    res.status(401).json({
      error: 'invalid_client',
      error_description: 'Client authentication failed'
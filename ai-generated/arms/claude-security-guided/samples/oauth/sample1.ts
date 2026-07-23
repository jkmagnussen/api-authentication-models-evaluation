```typescript
import express, { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { URL } from 'url';

const authRouter = Router();

interface AuthorizationRequest {
  clientId: string;
  redirectUri: string;
  scopes: string[];
  state: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}

interface StoredAuthSession {
  clientId: string;
  redirectUri: string;
  scopes: string[];
  createdAt: number;
  expiresAt: number;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}

const AUTHORIZED_CLIENTS = new Map<string, { redirectUris: string[]; allowedScopes: string[] }>([
  ['client-123', { redirectUris: ['http://localhost:3001/callback', 'https://app.example.com/callback'], allowedScopes: ['read:profile', 'write:data', 'openid', 'email'] }],
  ['client-456', { redirectUris: ['http://localhost:3002/callback', 'https://another-app.example.com/callback'], allowedScopes: ['read:profile', 'openid'] }],
]);

const authSessions = new Map<string, StoredAuthSession>();
const SESSION_EXPIRY_MS = 10 * 60 * 1000;

function validateClientId(clientId: string): boolean {
  if (!clientId || typeof clientId !== 'string') {
    return false;
  }
  return AUTHORIZED_CLIENTS.has(clientId);
}

function validateRedirectUri(clientId: string, redirectUri: string): boolean {
  if (!redirectUri || typeof redirectUri !== 'string') {
    return false;
  }
  
  try {
    const url = new URL(redirectUri);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }
    
    const client = AUTHORIZED_CLIENTS.get(clientId);
    if (!client) {
      return false;
    }
    
    return client.redirectUris.some(allowed => {
      try {
        const allowedUrl = new URL(allowed);
        return url.protocol === allowedUrl.protocol && 
               url.hostname === allowedUrl.hostname && 
               url.pathname === allowedUrl.pathname;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

function validateScopes(clientId: string, requestedScopes: string[]): boolean {
  if (!Array.isArray(requestedScopes) || requestedScopes.length === 0) {
    return false;
  }
  
  const client = AUTHORIZED_CLIENTS.get(clientId);
  if (!client) {
    return false;
  }
  
  return requestedScopes.every(scope => client.allowedScopes.includes(scope));
}

function validateState(state: string): boolean {
  if (!state || typeof state !== 'string') {
    return false;
  }
  if (state.length < 10 || state.length > 500) {
    return false;
  }
  return /^[a-zA-Z0-9\-._~+/]+=*$/.test(state);
}

function validateCodeChallenge(challenge: string, method: string): boolean {
  if (!challenge || typeof challenge !== 'string') {
    return false;
  }
  
  if (challenge.length < 43 || challenge.
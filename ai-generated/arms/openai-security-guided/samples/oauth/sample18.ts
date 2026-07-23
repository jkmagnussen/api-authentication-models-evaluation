```typescript
import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { URL } from 'url';

const app = express();

// Configuration
const OAUTH_CONFIG = {
  clientId: process.env.OAUTH_CLIENT_ID || 'test-client-id',
  clientSecret: process.env.OAUTH_CLIENT_SECRET || 'test-client-secret',
  redirectUris: (process.env.OAUTH_REDIRECT_URIS || 'http://localhost:3000/callback').split(','),
  validScopes: ['read', 'write', 'delete', 'profile'],
  stateExpiryMs: 10 * 60 * 1000, // 10 minutes
};

// In-memory store for state parameters (use Redis/database in production)
const stateStore = new Map<string, { expiresAt: number; scope: string }>();

// Validate redirect URI against whitelist
export function validateRedirectUri(redirectUri: string): boolean {
  try {
    const url = new URL(redirectUri);
    
    // Must be https in production
    if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
      return false;
    }
    
    // Check against whitelist
    return OAUTH_CONFIG.redirectUris.some(whitelistedUri => {
      try {
        const whitelistUrl = new URL(whitelistedUri);
        return url.origin === whitelistUrl.origin && url.pathname === whitelistUrl.pathname;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

// Validate and parse requested scopes
export function validateRequestedScopes(scopeString: string | undefined): string[] {
  if (!scopeString) {
    return [];
  }
  
  const requestedScopes = scopeString.split(' ').filter(scope => scope.length > 0);
  
  // Validate each scope
  const validScopes = requestedScopes.filter(scope => {
    const isValid = OAUTH_CONFIG.validScopes.includes(scope);
    if (!isValid) {
      console.warn(`Invalid scope requested: ${scope}`);
    }
    return isValid;
  });
  
  if (validScopes.length === 0) {
    return [];
  }
  
  return validScopes;
}

// Generate secure state parameter
export function generateStateParameter(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Store state parameter with expiration
export function storeStateParameter(state: string, scope: string): boolean {
  try {
    stateStore.set(state, {
      expiresAt: Date.now() + OAUTH_CONFIG.stateExpiryMs,
      scope,
    });
    return true;
  } catch (error) {
    console.error('Failed to store state parameter:', error);
    return false;
  }
}

// Verify and retrieve state parameter
export function verifyStateParameter(state: string): { valid: boolean; scope: string } {
  const stored = stateStore.get(state);
  
  if (!stored) {
    return { valid: false, scope: '' };
  }
  
  // Check expiration
  if (Date.now() > stored.expiresAt) {
    stateStore.delete(state);
    return { valid: false, scope: '' };
  }
  
  // Consume state (one-time use)
  stateStore.delete(state);
  
  return { valid: true, scope: stored.scope };
```typescript
import Anthropic from '@anthropic-ai/sdk';
import express, { Request, Response, NextlewareFunction } from 'express';
import crypto from 'crypto';

const client = new Anthropic();

interface OAuth2Request {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  state?: string;
  scope?: string;
  nonce?: string;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  errorDescription?: string;
}

const REGISTERED_CLIENTS = new Map([
  ['client_123', { secret: 'secret_456', redirectUris: ['http://localhost:3001/callback'] }],
  ['trusted_client', { secret: 'trusted_secret', redirectUris: ['https://example.com/callback', 'https://example.com/auth/callback'] }],
]);

const authorizationCodes = new Map<string, { clientId: string; userId: string; redirectUri: string; scope: string; expiresAt: number }>();

function validateClientId(clientId: string): ValidationResult {
  if (!clientId || typeof clientId !== 'string' || clientId.length === 0) {
    return { valid: false, error: 'invalid_request', errorDescription: 'Missing or invalid client_id' };
  }

  if (!REGISTERED_CLIENTS.has(clientId)) {
    return { valid: false, error: 'invalid_client', errorDescription: 'Client not registered' };
  }

  return { valid: true };
}

function validateRedirectUri(clientId: string, redirectUri: string): ValidationResult {
  if (!redirectUri || typeof redirectUri !== 'string') {
    return { valid: false, error: 'invalid_request', errorDescription: 'Missing or invalid redirect_uri' };
  }

  try {
    new URL(redirectUri);
  } catch {
    return { valid: false, error: 'invalid_request', errorDescription: 'Invalid redirect_uri format' };
  }

  const client = REGISTERED_CLIENTS.get(clientId);
  if (!client || !client.redirectUris.includes(redirectUri)) {
    return { valid: false, error: 'invalid_grant', errorDescription: 'Redirect URI not registered for client' };
  }

  return { valid: true };
}

function validateResponseType(responseType: string): ValidationResult {
  if (!responseType || typeof responseType !== 'string') {
    return { valid: false, error: 'invalid_request', errorDescription: 'Missing or invalid response_type' };
  }

  if (responseType !== 'code' && responseType !== 'token' && responseType !== 'id_token') {
    return { valid: false, error: 'unsupported_response_type', errorDescription: 'Unsupported response_type' };
  }

  return { valid: true };
}

function validateState(state: string | undefined): ValidationResult {
  if (state && (typeof state !== 'string' || state.length > 500)) {
    return { valid: false, error: 'invalid_request', errorDescription: 'Invalid state parameter' };
  }

  return { valid: true };
}

function validateScope(scope: string | undefined): ValidationResult {
  if (!scope) {
    return { valid: true };
  }

  if (typeof scope !== 'string' || scope.length > 1000) {
    return { valid: false, error: 'invalid_request', errorDescription: 'Invalid scope parameter' };
  }

  const allowedScopes = ['openid', 'profile', 'email', 'offline_
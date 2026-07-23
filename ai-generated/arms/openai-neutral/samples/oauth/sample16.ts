```typescript
import express, { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { URL } from 'url';

const ALLOWED_SCOPES = new Set(['read', 'write', 'delete', 'admin']);
const ALLOWED_REDIRECT_DOMAINS = new Set([
  'localhost:3001',
  'localhost:3000',
  'app.example.com',
  'admin.example.com'
]);

const STATE_STORE = new Map<string, { expiresAt: number; nonce: string }>();
const STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

function validateRedirectUri(redirectUri: string): boolean {
  try {
    const url = new URL(redirectUri);
    
    if (!url.protocol.match(/^https?:$/)) {
      return false;
    }

    if (url.protocol === 'http:' && url.hostname !== 'localhost' && !url.hostname.startsWith('127.')) {
      return false;
    }

    return ALLOWED_REDIRECT_DOMAINS.has(url.host);
  } catch {
    return false;
  }
}

function parseScopeParam(scopeParam: string | undefined): Set<string> {
  if (!scopeParam || typeof scopeParam !== 'string') {
    return new Set();
  }

  return new Set(
    scopeParam
      .split(/\s+/)
      .filter(scope => ALLOWED_SCOPES.has(scope))
  );
}

function sanitizeState(state: string | undefined): string | null {
  if (!state || typeof state !== 'string') {
    return null;
  }

  if (state.length > 128 || !/^[a-zA-Z0-9_\-]+$/.test(state)) {
    return null;
  }

  return state;
}

function generateAuthorizationCode(clientId: string, userId: string, requestedScopes: Set<string>): string {
  const payload = {
    clientId,
    userId,
    scopes: Array.from(requestedScopes),
    issuedAt: Date.now(),
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
  };

  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

export function createOAuth2AuthorizationRouter(): Router {
  const router = Router();

  router.get('/oauth2/authorize', (req: Request, res: Response) => {
    const { client_id, redirect_uri, response_type, scope, state, prompt } = req.query;

    // Validate response_type
    if (response_type !== 'code') {
      return res.status(400).json({
        error: 'unsupported_response_type',
        error_description: 'Only authorization code flow is supported'
      });
    }

    // Validate client_id
    if (!client_id || typeof client_id !== 'string' || client_id.length === 0) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing or invalid client_id parameter'
      });
    }

    // Validate redirect_uri
    if (!redirect_uri || typeof redirect_uri !== 'string') {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing redirect_uri parameter'
      });
    }

    if (!validateRedirectUri(redirect_uri)) {
      return res
import express, { Request, Response } from 'express';
import { authorizeClient, validateScopes, generateState, verifyRedirectUri } from './authUtils';
import { authConfig } from './config';

export const oauth2Router = express.Router();

oauth2Router.get('/authorize', (req: Request, res: Response) => {
  const { client_id, redirect_uri, response_type, scope, state } = req.query;

  if (!client_id || !response_type || !scope) {
    return res.status(400).json({ error: 'invalid_request' });
  }

  const scopes = (scope as string).split(' ');
  if (!validateScopes(scopes)) {
    return res.status(400).json({ error: 'invalid_scope' });
  }

  if (!authorizeClient(client_id as string, response_type as string)) {
    return res.status(400).json({ error: 'unauthorized_client' });
  }

  if (!verifyRedirectUri(client_id as string, redirect_uri as string)) {
    return res.status(400).json({ error: 'invalid_redirect_uri' });
  }

  const generatedState = state || generateState();

  const redirectUrl = new URL(redirect_uri as string);
  redirectUrl.searchParams.append('code', 'authCode12345');
  redirectUrl.searchParams.append('state', generatedState);

  return res.redirect(redirectUrl.toString());
});

// authUtils.ts - Utilities for authorization
export function authorizeClient(clientId: string, responseType: string): boolean {
  return authConfig.clients.includes(clientId) && responseType === 'code';
}

export function validateScopes(scopes: string[]): boolean {
  return scopes.every(scope => authConfig.supportedScopes.includes(scope));
}

export function generateState(): string {
  return 'state' + Math.random().toString(36).substring(2, 15);
}

export function verifyRedirectUri(clientId: string, redirectUri: string): boolean {
  return authConfig.redirectUris[clientId]?.includes(redirectUri) ?? false;
}
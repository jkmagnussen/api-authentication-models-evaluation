import express, { Request, Response, NextFunction } from 'express';
import { URL } from 'url';
import crypto from 'crypto';

const app = express();

const validRedirectUris = new Set(['https://example.com/callback']);
const validScopes = new Set(['read', 'write', 'delete']);

function validateRedirectUri(uri: string): boolean {
  try {
    const parsedUri = new URL(uri);
    return validRedirectUris.has(parsedUri.origin);
  } catch {
    return false;
  }
}

function validateScope(scope: string): boolean {
  const requestedScopes = scope.split(' ');
  return requestedScopes.every(sc => validScopes.has(sc));
}

function generateStateParameter(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function oauthRouter() {
  const router = express.Router();

  router.get('/authorize', (req: Request, res: Response, next: NextFunction) => {
    const { response_type, client_id, redirect_uri, scope, state } = req.query;

    if (!client_id || typeof client_id !== 'string') {
      return res.status(400).send('Invalid client_id');
    }

    if (!response_type || response_type !== 'code') {
      return res.status(400).send('Invalid or missing response_type');
    }

    if (!redirect_uri || typeof redirect_uri !== 'string' || !validateRedirectUri(redirect_uri)) {
      return res.status(400).send('Invalid redirect_uri');
    }

    if (scope && !validateScope(scope as string)) {
      return res.status(400).send('Invalid scope');
    }

    const authCode = crypto.randomBytes(16).toString('hex');
    const newState = state || generateStateParameter();

    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.append('code', authCode);
    if (newState) redirectUrl.searchParams.append('state', newState);

    res.redirect(redirectUrl.toString());
  });

  return router;
}

app.use('/oauth', oauthRouter());
import express, { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { URL } from 'url';

const app = express();

const VALID_REDIRECT_URIS = ['https://example.com/callback'];
const VALID_SCOPES = ['read', 'write'];
const STATE_SIZE_BYTES = 16;

function isValidRedirectUri(uri: string): boolean {
  try {
    const url = new URL(uri);
    return VALID_REDIRECT_URIS.includes(url.toString());
  } catch {
    return false;
  }
}

function validateScopes(scopes: string[]): boolean {
  return scopes.every(scope => VALID_SCOPES.includes(scope));
}

app.get('/auth', (req: Request, res: Response) => {
  const { redirect_uri, state, scope } = req.query;
  
  if (typeof redirect_uri !== 'string' || !isValidRedirectUri(redirect_uri)) {
    return res.status(400).send('Invalid redirect URI');
  }

  if (typeof state !== 'string' || state.length !== STATE_SIZE_BYTES * 2) {
    return res.status(400).send('Invalid state parameter');
  }

  const scopes = typeof scope === 'string' ? scope.split(' ') : [];
  if (!validateScopes(scopes)) {
    return res.status(400).send('Invalid scope');
  }

  const generatedState = randomBytes(STATE_SIZE_BYTES).toString('hex');
  // Store generatedState securely tied to user's session

  res.redirect(`${redirect_uri}?state=${generatedState}&scope=${scopes.join(' ')}`);
});

export default app;
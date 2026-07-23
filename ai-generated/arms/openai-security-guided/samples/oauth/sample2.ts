import { Request, Response, NextFunction } from 'express';
import { URL } from 'url';
import crypto from 'crypto';

const validRedirectURIs = ['https://trustedclient.com/callback'];
const validScopes = new Set(['read', 'write', 'profile']);

function secureRandomString(length: number): string {
  return crypto.randomBytes(length).toString('hex');
}

export function handleOAuth2Authorize(req: Request, res: Response, next: NextFunction): void {
  const { redirect_uri, state, scope } = req.query as { redirect_uri?: string, state?: string, scope?: string };

  if (!redirect_uri) {
    return res.status(400).json({ error: 'invalid_request', error_description: 'Missing redirect_uri' });
  }

  try {
    const uri = new URL(redirect_uri);
    if (!validRedirectURIs.includes(uri.origin)) {
      return res.status(400).json({ error: 'invalid_request', error_description: 'Untrusted redirect_uri' });
    }
  } catch (err) {
    return res.status(400).json({ error: 'invalid_request', error_description: 'Invalid redirect_uri format' });
  }

  if (!scope || !scope.split(' ').every(s => validScopes.has(s))) {
    return res.status(400).json({ error: 'invalid_scope', error_description: 'Invalid or missing scope' });
  }

  const code = secureRandomString(32);

  const responseParams = new URLSearchParams({ code });
  if (state) {
    responseParams.append('state', state);
  }

  res.redirect(`${redirect_uri}?${responseParams.toString()}`);
}
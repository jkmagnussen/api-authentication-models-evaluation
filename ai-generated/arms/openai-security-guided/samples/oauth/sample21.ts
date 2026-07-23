import express, { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { URL } from 'url';

const app = express();

interface OAuthRequest extends Request {
  query: {
    response_type?: string;
    client_id?: string;
    redirect_uri?: string;
    scope?: string;
    state?: string;
  };
}

const validClients = new Map<string, string>([['client123', 'http://localhost:3000/callback']]);
const validScopes = new Set(['read', 'write', 'delete']);

export const authorize = (req: OAuthRequest, res: Response): void => {
  const { response_type, client_id, redirect_uri, scope, state } = req.query;

  if (response_type !== 'code' || !client_id || !redirect_uri || !scope) {
    return res.status(400).send('Invalid request parameters.');
  }

  const registeredRedirectURI = validClients.get(client_id);
  if (!registeredRedirectURI || registeredRedirectURI !== redirect_uri) {
    return res.status(400).send('Invalid client or redirect URI.');
  }

  try {
    const redirectURL = new URL(redirect_uri);
    if (redirectURL.protocol !== 'http:' && redirectURL.protocol !== 'https:') {
      throw new Error('Invalid protocol');
    }
  } catch {
    return res.status(400).send('Invalid redirect URI.');
  }

  const requestedScopes = scope.split(' ');
  for (const requestedScope of requestedScopes) {
    if (!validScopes.has(requestedScope)) {
      return res.status(400).send('Invalid or unauthorized scopes.');
    }
  }

  const authorizationCode = randomBytes(16).toString('hex');
  const redirectWithParams = new URL(redirect_uri);
  redirectWithParams.searchParams.append('code', authorizationCode);
  if (state) {
    redirectWithParams.searchParams.append('state', state);
  }

  res.redirect(redirectWithParams.toString());
};

app.get('/authorize', authorize);
export default app;
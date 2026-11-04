import express, { Request, Response } from 'express';
import { randomBytes } from 'crypto';

interface AuthRequest extends Request {
  query: {
    response_type: string;
    client_id: string;
    redirect_uri: string;
    scope: string;
    state: string;
  };
}

const app = express();

const clients = new Map<string, { redirectUri: string; scopes: string[] }>([
  ['client123', { redirectUri: 'http://localhost:3000/callback', scopes: ['read', 'write'] }]
]);

export const authorizationEndpoint = async (req: AuthRequest, res: Response) => {
  const { response_type, client_id, redirect_uri, scope, state } = req.query;

  if (response_type !== 'code') {
    return res.status(400).send('Unsupported response type');
  }

  if (!clients.has(client_id)) {
    return res.status(400).send('Invalid client ID');
  }

  const client = clients.get(client_id);
  if (client && client.redirectUri !== redirect_uri) {
    return res.status(400).send('Invalid redirect URI');
  }

  const requestedScopes = scope.split(' ');
  const invalidScopes = requestedScopes.some(s => !client?.scopes.includes(s));
  if (invalidScopes) {
    return res.status(400).send('Invalid scope');
  }

  const authorizationCode = randomBytes(20).toString('hex');
  // Store authorization code with associated client_id in a secure way
  // e.g., in a database or in-memory store

  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.append('code', authorizationCode);
  if (state) {
    redirectUrl.searchParams.append('state', state);
  }

  res.redirect(redirectUrl.toString());
};

app.get('/authorize', authorizationEndpoint);

app.listen(4000, () => {
  console.log('Authorization server started on http://localhost:4000');
});
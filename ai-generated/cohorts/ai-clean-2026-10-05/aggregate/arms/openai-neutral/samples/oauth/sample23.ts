import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { URL } from 'url';

const app = express();
app.use(express.json());

interface AuthorizationRequest {
  response_type: string;
  client_id: string;
  redirect_uri: string;
  scope?: string;
  state?: string;
}

const clients = new Map<string, { clientSecret: string, redirectUris: string[] }>();
const authorizationCodes = new Map<string, { clientId: string, redirectUri: string }>();

clients.set('client-id-123', {
  clientSecret: 'client-secret-abc',
  redirectUris: ['http://localhost:3000/callback']
});

app.get('/oauth/authorize', (req: Request, res: Response) => {
  const { response_type, client_id, redirect_uri, state, scope } = req.query as AuthorizationRequest;

  if (response_type !== 'code') {
    return res.status(400).send('Unsupported response_type');
  }

  const client = clients.get(client_id);
  if (!client || !client.redirectUris.includes(redirect_uri)) {
    return res.status(400).send('Invalid client or redirect URI');
  }

  const authorizationCode = crypto.randomBytes(20).toString('hex');
  authorizationCodes.set(authorizationCode, { clientId: client_id, redirectUri: redirect_uri });

  const url = new URL(redirect_uri);
  url.searchParams.append('code', authorizationCode);
  if (state) {
    url.searchParams.append('state', state);
  }

  res.redirect(url.toString());
});

const listener = app.listen(3000, () => {
  console.log('OAuth 2.0 Authorization Server running on port 3000');
});

export { app, listener };
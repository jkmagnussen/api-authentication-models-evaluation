import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { URL } from 'url';

const app = express();
const port = 3000;

const clients = new Map<string, { redirectUri: string, clientSecret: string }>();
const authorizationCodes = new Map<string, { clientId: string, redirectUri: string }>();

clients.set('client1', { redirectUri: 'http://localhost:4000/callback', clientSecret: 'secret1' });

app.get('/authorize', (req: Request, res: Response) => {
  const { response_type, client_id, redirect_uri, state } = req.query as Record<string, string>;

  const client = clients.get(client_id);
  if (!client || client.redirectUri !== redirect_uri) {
    return res.status(400).send('Invalid client or redirect URI');
  }

  if (response_type !== 'code') {
    return res.status(400).send('Unsupported response type');
  }

  const authCode = crypto.randomBytes(16).toString('hex');
  authorizationCodes.set(authCode, { clientId: client_id, redirectUri: redirect_uri });

  const redirectURL = new URL(redirect_uri);
  redirectURL.searchParams.append('code', authCode);
  if (state) redirectURL.searchParams.append('state', state);

  res.redirect(redirectURL.toString());
});

app.listen(port, () => {
  console.log(`Authorization server running on http://localhost:${port}`);
});

export { app, clients, authorizationCodes };
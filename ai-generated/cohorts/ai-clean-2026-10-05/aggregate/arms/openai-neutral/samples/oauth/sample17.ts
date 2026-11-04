import express, { Request, Response } from 'express';
import { randomBytes } from 'crypto';

const app = express();
app.use(express.json());

const clients = new Map<string, { clientSecret: string, redirectUri: string }>();
clients.set('client_id_example', { clientSecret: 'secret_example', redirectUri: 'http://localhost:3000/callback' });

const authorizationCodes = new Map<string, { clientId: string, redirectUri: string, scope: string }>();

app.get('/authorize', (req: Request, res: Response) => {
  const { response_type, client_id, redirect_uri, scope, state } = req.query as Record<string, string>;

  if (response_type !== 'code') {
    return res.status(400).send('Unsupported response type');
  }

  const client = clients.get(client_id);
  if (!client || client.redirectUri !== redirect_uri) {
    return res.status(400).send('Invalid client or redirect URI');
  }

  const authCode = randomBytes(16).toString('hex');
  authorizationCodes.set(authCode, { clientId: client_id, redirectUri: redirect_uri, scope });

  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.set('code', authCode);
  if (state) {
    redirectUrl.searchParams.set('state', state);
  }

  res.redirect(redirectUrl.toString());
});

export { app };
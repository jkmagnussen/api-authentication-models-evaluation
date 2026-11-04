import express, { Request, Response } from 'express';
import { randomBytes } from 'crypto';

const app = express();
app.use(express.json());

const clients = new Map<string, { clientId: string, redirectUri: string }>();
const authorizationCodes = new Map<string, { clientId: string, scope: string }>();

clients.set('client123', { clientId: 'client123', redirectUri: 'http://localhost:4000/callback' });

app.get('/authorize', (req: Request, res: Response) => {
  const { response_type, client_id, redirect_uri, scope, state } = req.query as Record<string, string>;

  const client = clients.get(client_id);
  if (!client || client.redirectUri !== redirect_uri) {
    return res.status(400).send('Invalid client or redirect URI');
  }

  if (response_type !== 'code') {
    return res.status(400).send('Unsupported response type');
  }

  const authorizationCode = randomBytes(20).toString('hex');
  authorizationCodes.set(authorizationCode, { clientId: client_id, scope });

  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.append('code', authorizationCode);
  if (state) redirectUrl.searchParams.append('state', state);

  res.redirect(redirectUrl.toString());
});

export { app };
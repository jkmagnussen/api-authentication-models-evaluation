import express, { Request, Response } from 'express';
import { randomBytes } from 'crypto';

const oauthRouter = express.Router();

const clients = new Map<string, { clientSecret: string, redirectUris: string[] }>();
clients.set('client_id_example', { clientSecret: 'secret123', redirectUris: ['http://localhost:3000/callback'] });

const authorizationCodes = new Map<string, { clientId: string, redirectUri: string }>();

oauthRouter.get('/authorize', (req: Request, res: Response) => {
  const { response_type, client_id, redirect_uri, state } = req.query;

  if (!response_type || response_type !== 'code') {
    return res.status(400).send('Invalid response type');
  }

  const client = clients.get(client_id as string);
  if (!client || !client.redirectUris.includes(redirect_uri as string)) {
    return res.status(400).send('Invalid client or redirect URI');
  }

  const authCode = randomBytes(20).toString('hex');
  authorizationCodes.set(authCode, { clientId: client_id as string, redirectUri: redirect_uri as string });
  
  const redirectTo = new URL(redirect_uri as string);
  redirectTo.searchParams.append('code', authCode);
  if (state) redirectTo.searchParams.append('state', state as string);

  res.redirect(redirectTo.toString());
});

export { oauthRouter };
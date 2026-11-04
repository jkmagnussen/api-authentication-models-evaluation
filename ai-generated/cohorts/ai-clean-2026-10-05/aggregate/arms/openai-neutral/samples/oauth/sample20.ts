import express, { Request, Response } from 'express';
import crypto from 'crypto';

const router = express.Router();

const clients = new Map<string, { clientSecret: string, redirectUri: string }>();
clients.set('client_id_example', {
  clientSecret: 'client_secret_example',
  redirectUri: 'http://localhost:3000/callback'
});

const authorizeRequests = new Map<string, { clientId: string, redirectUri: string, scope: string }>();

export const authorizationEndpoint = (req: Request, res: Response) => {
  const { response_type, client_id, redirect_uri, scope, state } = req.query;

  if (response_type !== 'code') {
    return res.status(400).send('Unsupported response_type');
  }

  const client = clients.get(client_id as string);
  if (!client || client.redirectUri !== redirect_uri) {
    return res.status(400).send('Invalid client_id or redirect_uri');
  }

  const authorizationCode = crypto.randomBytes(16).toString('hex');
  authorizeRequests.set(authorizationCode, {
    clientId: client_id as string,
    redirectUri: redirect_uri as string,
    scope: scope as string
  });

  const redirectUrl = new URL(redirect_uri as string);
  redirectUrl.searchParams.append('code', authorizationCode);
  if (state) {
    redirectUrl.searchParams.append('state', state as string);
  }

  res.redirect(redirectUrl.toString());
};

router.get('/authorize', authorizationEndpoint);

export { router as authRouter };
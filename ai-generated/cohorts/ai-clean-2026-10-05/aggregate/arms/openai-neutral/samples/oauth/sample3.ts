import express, { Request, Response } from 'express';
import { randomBytes } from 'crypto';

const app = express();
app.use(express.json());

const clients = new Map<string, string>(); // client_id -> client_secret
const redirectUris = new Map<string, string[]>(); // client_id -> redirect_uris
const authorizationCodes = new Map<string, { clientId: string, redirectUri: string }>(); // code -> clientId, redirectUri

clients.set('client_id_example', 'client_secret_example');
redirectUris.set('client_id_example', ['http://localhost:3000/callback']);

export const authorizationEndpoint = async (req: Request, res: Response) => {
  const { response_type, client_id, redirect_uri, scope, state } = req.query;

  if (response_type !== 'code') {
    return res.status(400).send('Unsupported response type');
  }

  if (!client_id || !clients.has(client_id as string)) {
    return res.status(400).send('Invalid client_id');
  }

  const validRedirectUris = redirectUris.get(client_id as string);
  if (!redirect_uri || !validRedirectUris || !validRedirectUris.includes(redirect_uri as string)) {
    return res.status(400).send('Invalid redirect_uri');
  }

  const authorizationCode = randomBytes(20).toString('hex');
  authorizationCodes.set(authorizationCode, { clientId: client_id as string, redirectUri: redirect_uri as string });

  const redirectUrl = new URL(redirect_uri as string);
  redirectUrl.searchParams.append('code', authorizationCode);
  if (state) {
    redirectUrl.searchParams.append('state', state as string);
  }

  res.redirect(redirectUrl.toString());
};

app.get('/authorize', authorizationEndpoint);

app.listen(4000, () => {
  console.log('Auth server listening on port 4000');
});
import express, { Request, Response } from 'express';
import { randomBytes } from 'crypto';

const app = express();
app.use(express.urlencoded({ extended: true }));

interface AuthorizeRequestQuery {
  response_type: string;
  client_id: string;
  redirect_uri: string;
  scope?: string;
  state?: string;
}

const clients = new Map<string, { redirectUri: string }>([
  ['client1', { redirectUri: 'http://localhost:3000/callback' }]
]);

const generateAuthorizationCode = (): string => randomBytes(16).toString('hex');
const authorizationCodes = new Map<string, string>();

app.get('/oauth/authorize', (req: Request<{}, {}, {}, AuthorizeRequestQuery>, res: Response) => {
  const { response_type, client_id, redirect_uri, state } = req.query;

  if (response_type !== 'code') {
    return res.status(400).send('Unsupported response type');
  }

  const client = clients.get(client_id);
  if (!client || client.redirectUri !== redirect_uri) {
    return res.status(400).send('Invalid client');
  }

  const authorizationCode = generateAuthorizationCode();
  authorizationCodes.set(authorizationCode, client_id);

  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.append('code', authorizationCode);
  if (state) {
    redirectUrl.searchParams.append('state', state);
  }

  res.redirect(redirectUrl.toString());
});

export { app };
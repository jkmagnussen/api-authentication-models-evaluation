import express, { Request, Response } from 'express';
import { randomBytes } from 'crypto';

interface Client {
  clientId: string;
  redirectUris: string[];
}

interface AuthorizationRequest {
  clientId: string;
  redirectUri: string;
  state: string;
  responseType: string;
  scope: string;
}

const clients: Client[] = [
  { clientId: 'abc123', redirectUris: ['http://localhost:3000/callback'] }
];

const app = express();
const port = 3001;

export const authorizationEndpoint = (req: Request, res: Response): void => {
  const { client_id, redirect_uri, response_type, scope, state } = req.query as any;

  const client = clients.find(c => c.clientId === client_id);
  if (!client || !client.redirectUris.includes(redirect_uri)) {
    return res.status(400).send('Invalid client or redirect URI');
  }

  if (response_type !== 'code') {
    return res.status(400).send('Unsupported response type');
  }

  const authorizationCode = randomBytes(20).toString('hex');

  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.append('code', authorizationCode);
  if (state) {
    redirectUrl.searchParams.append('state', state);
  }

  res.redirect(redirectUrl.toString());
};

app.get('/oauth/authorize', authorizationEndpoint);

app.listen(port, () => {
  console.log(`Authorization server is running at http://localhost:${port}`);
});
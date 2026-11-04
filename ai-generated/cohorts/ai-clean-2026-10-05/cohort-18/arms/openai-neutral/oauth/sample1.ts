import express, { Request, Response } from 'express';
import crypto from 'crypto';

const app = express();

interface Client {
  clientId: string;
  redirectUris: string[];
}

interface AuthorizationRequest {
  clientId: string;
  redirectUri: string;
  responseType: string;
  scope: string;
  state?: string;
}

const clients: Client[] = [
  {
    clientId: 'abc123',
    redirectUris: ['http://localhost:3000/callback'],
  },
];

const validateClient = (clientId: string, redirectUri: string): boolean => {
  const client = clients.find((client) => client.clientId === clientId);
  return !!client && client.redirectUris.includes(redirectUri);
};

const generateAuthorizationCode = (): string => {
  return crypto.randomBytes(16).toString('hex');
};

export const authorizationEndpoint = (req: Request, res: Response) => {
  const { client_id, redirect_uri, response_type, scope, state } = req.query;
  const authorizationRequest: AuthorizationRequest = {
    clientId: client_id as string,
    redirectUri: redirect_uri as string,
    responseType: response_type as string,
    scope: scope as string,
    state: state as string | undefined,
  };

  if (!validateClient(authorizationRequest.clientId, authorizationRequest.redirectUri)) {
    return res.status(400).send('Invalid client or redirect URI');
  }

  if (authorizationRequest.responseType !== 'code') {
    return res.status(400).send('Invalid response type');
  }

  const authorizationCode = generateAuthorizationCode();

  let redirectUrl = `${authorizationRequest.redirectUri}?code=${authorizationCode}`;
  if (authorizationRequest.state) {
    redirectUrl += `&state=${authorizationRequest.state}`;
  }

  res.redirect(redirectUrl);
};

app.get('/authorize', authorizationEndpoint);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Authorization Server running on http://localhost:${PORT}`);
});
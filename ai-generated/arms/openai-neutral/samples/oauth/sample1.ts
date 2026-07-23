import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import querystring from 'querystring';

interface AuthorizationRequest {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope?: string;
  state?: string;
}

const app = express();

const registeredClients = new Map<string, { redirectUris: string[] }>([
  ['client123', { redirectUris: ['http://localhost:3000/callback'] }]
]);

app.get('/authorize', (req: Request, res: Response) => {
  const { client_id, redirect_uri, response_type, scope, state } = req.query as AuthorizationRequest;

  if (!client_id || !redirect_uri || response_type !== 'code') {
    return res.status(400).send('Invalid request parameters');
  }

  const client = registeredClients.get(client_id);
  if (!client || !client.redirectUris.includes(redirect_uri)) {
    return res.status(400).send('Invalid client or redirect URI');
  }

  const authorizationCode = uuidv4();
  // Assuming the codeStore is a place where we store the authorization codes temporarily
  const codeStore = new Map<string, string>();
  codeStore.set(authorizationCode, client_id);

  const redirectParams = {
    code: authorizationCode,
    state: state || ''
  };

  res.redirect(`${redirect_uri}?${querystring.stringify(redirectParams)}`);
});

export { app as authApp };
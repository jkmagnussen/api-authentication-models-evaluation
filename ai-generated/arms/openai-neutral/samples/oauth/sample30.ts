import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bodyParser from 'body-parser';

const authApp = express();
authApp.use(bodyParser.urlencoded({ extended: true }));

interface Client {
  clientId: string;
  redirectUris: string[];
}

interface AuthorizationCode {
  code: string;
  clientId: string;
  redirectUri: string;
  user: string;
}

const clients: Record<string, Client> = {
  'client123': { clientId: 'client123', redirectUris: ['http://localhost/callback'] }
};

const authorizationCodes: AuthorizationCode[] = [];

export const authorizationEndpoint = authApp.post('/authorize', (req: Request, res: Response) => {
  const { response_type, client_id, redirect_uri, scope, state, user } = req.body;

  if (response_type !== 'code') {
    return res.status(400).send('Invalid response_type');
  }

  const client = clients[client_id];
  if (!client || !client.redirectUris.includes(redirect_uri)) {
    return res.status(400).send('Invalid client_id or redirect_uri');
  }

  if (!user) {
    return res.status(400).send('User must be authenticated');
  }

  const code = uuidv4();
  authorizationCodes.push({
    code,
    clientId: client_id,
    redirectUri: redirect_uri,
    user
  });

  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.append('code', code);
  if (state) {
    redirectUrl.searchParams.append('state', state);
  }

  res.redirect(redirectUrl.toString());
});
import express, { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import querystring from 'querystring';

const app = express();
const port = 3000;

interface Client {
  clientId: string;
  redirectUris: string[];
}

interface AuthorizationRequest {
  clientId: string;
  redirectUri: string;
  state?: string;
  responseType: string;
}

const clients: Client[] = [
  { clientId: 'client1', redirectUris: ['http://localhost:4000/callback'] }
];

const isValidRedirectUri = (client: Client, redirectUri: string) => {
  return client.redirectUris.includes(redirectUri);
};

const findClientById = (clientId: string) => {
  return clients.find(client => client.clientId === clientId);
};

app.get('/authorize', (req: Request, res: Response, next: NextFunction) => {
  const { client_id, redirect_uri, state, response_type } = req.query;

  if (!client_id || !redirect_uri || !response_type) {
    return res.status(400).send('Missing required parameters');
  }

  const client = findClientById(client_id as string);

  if (!client || !isValidRedirectUri(client, redirect_uri as string)) {
    return res.status(400).send('Invalid client or redirect URI');
  }

  if (response_type !== 'code') {
    return res.status(400).send('Unsupported response type');
  }

  const authorizationCode = uuidv4();

  const redirectUrl = `${redirect_uri}?${querystring.stringify({
    code: authorizationCode,
    state: state as string
  })}`;

  res.redirect(redirectUrl);
});

app.listen(port, () => {
  console.log(`Authorization server running on http://localhost:${port}`);
});

export { app };
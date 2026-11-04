import express, { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

interface Client {
  clientId: string;
  redirectUris: string[];
}

interface AuthCode {
  code: string;
  clientId: string;
  redirectUri: string;
}

const clients: Client[] = [
  {
    clientId: 'client123',
    redirectUris: ['http://localhost:3000/callback']
  }
];

const authCodes: AuthCode[] = [];

const findClient = (clientId: string) => {
  return clients.find(client => client.clientId === clientId);
};

const isValidRedirectUri = (client: Client, redirectUri: string) => {
  return client.redirectUris.includes(redirectUri);
};

app.get('/authorize', (req: Request, res: Response, next: NextFunction) => {
  const { response_type, client_id, redirect_uri, state } = req.query;

  if (response_type !== 'code') {
    return res.status(400).send('Invalid response_type');
  }

  const client = findClient(client_id as string);
  if (!client) {
    return res.status(400).send('Invalid client_id');
  }

  if (!isValidRedirectUri(client, redirect_uri as string)) {
    return res.status(400).send('Invalid redirect_uri');
  }

  const authCode = uuidv4();
  authCodes.push({
    code: authCode,
    clientId: client_id as string,
    redirectUri: redirect_uri as string,
  });

  const redirectUrl = new URL(redirect_uri as string);
  redirectUrl.searchParams.append('code', authCode);
  if (state) {
    redirectUrl.searchParams.append('state', state as string);
  }

  res.redirect(redirectUrl.toString());
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`OAuth2 server running on http://localhost:${PORT}`);
});

export { app, clients, authCodes };
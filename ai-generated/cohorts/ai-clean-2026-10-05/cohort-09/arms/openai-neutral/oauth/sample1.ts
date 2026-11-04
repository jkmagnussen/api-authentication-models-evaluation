import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.urlencoded({ extended: true }));

interface Client {
  clientId: string;
  redirectUri: string;
}

const clients: Client[] = [
  { clientId: 'client123', redirectUri: 'http://localhost:3000/callback' }
];

interface AuthorizationCode {
  code: string;
  clientId: string;
  redirectUri: string;
  userId: string;
}

const authorizationCodes: AuthorizationCode[] = [];

app.get('/authorize', (req: Request, res: Response) => {
  const { response_type, client_id, redirect_uri, state } = req.query;

  if (!response_type || response_type !== 'code') {
    return res.status(400).send('Invalid response type');
  }

  const client = clients.find(client => client.clientId === client_id);
  if (!client || client.redirectUri !== redirect_uri) {
    return res.status(400).send('Invalid client or redirect URI');
  }

  // Simulate a user login
  const userId = 'user456';

  const authorizationCode: AuthorizationCode = {
    code: uuidv4(),
    clientId: client_id as string,
    redirectUri: redirect_uri as string,
    userId: userId
  };

  authorizationCodes.push(authorizationCode);

  const redirectUrl = new URL(redirect_uri as string);
  redirectUrl.searchParams.append('code', authorizationCode.code);
  if (state) {
    redirectUrl.searchParams.append('state', state as string);
  }

  res.redirect(redirectUrl.toString());
});

export { app };
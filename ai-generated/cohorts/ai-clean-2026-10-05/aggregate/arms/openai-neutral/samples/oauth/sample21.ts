import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

interface Client {
  clientId: string;
  redirectUris: string[];
}

interface AuthorizationCode {
  code: string;
  clientId: string;
  redirectUri: string;
  userId: string;
}

const clients: Client[] = [
  { clientId: 'client123', redirectUris: ['http://localhost/callback'] }
];

const authorizationCodes: AuthorizationCode[] = [];

export const authorizationEndpoint = (req: Request, res: Response) => {
  const { response_type, client_id, redirect_uri, scope, state } = req.query;

  if (response_type !== 'code') {
    return res.status(400).send('Invalid response_type');
  }

  const client = clients.find(c => c.clientId === client_id);
  if (!client) {
    return res.status(400).send('Invalid client_id');
  }

  if (!client.redirectUris.includes(redirect_uri as string)) {
    return res.status(400).send('Invalid redirect_uri');
  }

  const userId = 'user123'; // Simulate user authentication
  const code = uuidv4();
  authorizationCodes.push({ code, clientId: client_id as string, redirectUri: redirect_uri as string, userId });

  const redirectUrl = new URL(redirect_uri as string);
  redirectUrl.searchParams.append('code', code);
  if (state) {
    redirectUrl.searchParams.append('state', state as string);
  }

  res.redirect(redirectUrl.toString());
};

app.get('/authorize', authorizationEndpoint);

app.listen(3000, () => {
  console.log('Authorization server running on http://localhost:3000');
});
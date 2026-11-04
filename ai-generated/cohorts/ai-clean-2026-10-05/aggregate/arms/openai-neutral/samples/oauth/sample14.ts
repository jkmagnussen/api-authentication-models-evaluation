import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const port = 3000;

interface Client {
  clientId: string;
  redirectUri: string;
}

interface AuthCode {
  code: string;
  clientId: string;
  redirectUri: string;
}

const clients: Client[] = [
  { clientId: 'client123', redirectUri: 'http://localhost:4000/callback' }
];

const authCodes: AuthCode[] = [];

app.get('/authorize', (req: Request, res: Response) => {
  const { response_type, client_id, redirect_uri, state } = req.query;

  if (response_type !== 'code' || typeof client_id !== 'string' || typeof redirect_uri !== 'string') {
    return res.status(400).send('Invalid request');
  }

  const client = clients.find(c => c.clientId === client_id && c.redirectUri === redirect_uri);
  if (!client) {
    return res.status(400).send('Invalid client');
  }

  const authCode = uuidv4();
  authCodes.push({ code: authCode, clientId: client_id, redirectUri: redirect_uri });

  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.append('code', authCode);
  if (state) {
    redirectUrl.searchParams.append('state', state as string);
  }

  res.redirect(redirectUrl.toString());
});

app.listen(port, () => {
  console.log(`OAuth 2.0 authorization server running on port ${port}`);
});

export { app, clients, authCodes };
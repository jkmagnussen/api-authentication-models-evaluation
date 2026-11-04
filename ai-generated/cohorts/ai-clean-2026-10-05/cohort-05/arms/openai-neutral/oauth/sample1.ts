import express, { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { URLSearchParams } from 'url';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

interface Client {
  clientId: string;
  redirectUri: string;
}

interface AuthorizationCode {
  code: string;
  clientId: string;
  redirectUri: string;
  userId: string;
}

const clients: Client[] = [
  { clientId: 'client-123', redirectUri: 'http://localhost:3000/callback' }
];

const authorizationCodes: AuthorizationCode[] = [];

function generateAuthorizationCode(): string {
  return randomBytes(16).toString('hex');
}

app.get('/authorize', (req: Request, res: Response) => {
  const { response_type, client_id, redirect_uri, state, scope } = req.query;

  if (response_type !== 'code') {
    return res.status(400).send('Unsupported response type');
  }

  const client = clients.find(c => c.clientId === client_id && c.redirectUri === redirect_uri);
  if (!client) {
    return res.status(400).send('Invalid client');
  }

  const userId = 'user-123'; // In a real application, authenticate the user

  const code = generateAuthorizationCode();
  authorizationCodes.push({ code, clientId: client.clientId, redirectUri: client.redirectUri, userId });

  const params = new URLSearchParams({ code, state: state as string });
  res.redirect(`${redirect_uri}?${params.toString()}`);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Authorization server running on port ${PORT}`));

export { app, clients, authorizationCodes };
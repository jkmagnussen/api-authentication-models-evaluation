import express, { Request, Response } from 'express';
import { randomBytes } from 'crypto';

const app = express();
app.use(express.json());

interface Client {
  clientId: string;
  redirectUris: string[];
  clientSecret: string;
}

interface AuthorizationCode {
  code: string;
  clientId: string;
  redirectUri: string;
  userId: string;
}

const clients: Client[] = [
  {
    clientId: 'abc123',
    redirectUris: ['http://localhost:4000/callback'],
    clientSecret: 'ssh-secret',
  }
];

const authorizationCodes: AuthorizationCode[] = [];

app.get('/authorize', (req: Request, res: Response) => {
  const clientId = req.query.client_id as string;
  const redirectUri = req.query.redirect_uri as string;
  const state = req.query.state as string;
  const userId = 'user-xyz'; // Simulated authenticated user

  const client = clients.find(c => c.clientId === clientId);
  if (!client) {
    return res.status(400).send('Invalid client_id');
  }

  if (!client.redirectUris.includes(redirectUri)) {
    return res.status(400).send('Invalid redirect_uri');
  }

  const code = randomBytes(16).toString('hex');
  authorizationCodes.push({
    code,
    clientId: client.clientId,
    redirectUri,
    userId
  });

  const redirectUrl = new URL(redirectUri);
  redirectUrl.searchParams.append('code', code);
  if (state) {
    redirectUrl.searchParams.append('state', state);
  }

  res.redirect(redirectUrl.toString());
});

app.listen(3000, () => {
  console.log('Authorization server running on http://localhost:3000');
});

export { app, clients, authorizationCodes };
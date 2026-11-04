import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { URL } from 'url';

const app = express();
app.use(express.json());

interface Client {
  clientId: string;
  redirectUri: string;
}

const clients: Client[] = [
  { clientId: 'client123', redirectUri: 'https://example.com/callback' }
];

function validateClient(clientId: string, redirectUri: string): Client | null {
  const client = clients.find(c => c.clientId === clientId && c.redirectUri === redirectUri);
  return client || null;
}

function generateAuthCode(): string {
  return crypto.randomBytes(20).toString('hex');
}

app.get('/oauth/authorize', (req: Request, res: Response) => {
  const { response_type, client_id, redirect_uri, state } = req.query;

  if (response_type !== 'code' || !client_id || !redirect_uri) {
    return res.status(400).send('Invalid Request');
  }

  const client = validateClient(client_id as string, redirect_uri as string);
  if (!client) {
    return res.status(400).send('Invalid Client');
  }

  const authCode = generateAuthCode();

  try {
    const redirectUrl = new URL(client.redirectUri);
    redirectUrl.searchParams.set('code', authCode);
    if (state) {
      redirectUrl.searchParams.set('state', state as string);
    }
    return res.redirect(redirectUrl.toString());
  } catch (error) {
    return res.status(400).send('Invalid Redirect URI');
  }
});

export const oauthApp = app;
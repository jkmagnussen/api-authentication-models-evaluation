import express, { Request, Response } from 'express';
import { randomBytes } from 'crypto';

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
  { clientId: 'client1', redirectUris: ['http://localhost:3000/callback'] }
];

const authorizationCodes: AuthorizationCode[] = [];

const generateAuthorizationCode = (): string => {
  return randomBytes(16).toString('hex');
};

const isClientValid = (clientId: string, redirectUri: string): boolean => {
  const client = clients.find(c => c.clientId === clientId);
  return client !== undefined && client.redirectUris.includes(redirectUri);
};

app.get('/authorize', (req: Request, res: Response) => {
  const { response_type, client_id, redirect_uri, state } = req.query;
  
  if (response_type !== 'code' || !client_id || !redirect_uri) {
    return res.status(400).send('Invalid request');
  }

  if (!isClientValid(client_id as string, redirect_uri as string)) {
    return res.status(400).send('Invalid client');
  }

  const authorizationCode = generateAuthorizationCode();
  authorizationCodes.push({
    code: authorizationCode,
    clientId: client_id as string,
    redirectUri: redirect_uri as string,
    userId: 'user123' // Simulating a logged-in user
  });

  const redirectWithCode = `${redirect_uri}?code=${authorizationCode}&state=${state}`;
  res.redirect(redirectWithCode);
});

app.listen(4000, () => {
  console.log('OAuth 2.0 Authorization Server is running on port 4000');
});

export { app, clients, authorizationCodes };
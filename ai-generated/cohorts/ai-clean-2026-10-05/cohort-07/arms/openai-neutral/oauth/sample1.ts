import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import querystring from 'querystring';

const app = express();

type Client = {
  clientId: string;
  redirectUri: string;
};

type AuthorizationRequest = {
  response_type: string;
  client_id: string;
  redirect_uri: string;
  scope?: string;
  state?: string;
};

// Mock Database
const clients: Client[] = [
  { clientId: 'client123', redirectUri: 'http://localhost:3000/callback' }
];

const authorize = (req: Request, res: Response) => {
  const { response_type, client_id, redirect_uri, scope, state }: AuthorizationRequest = req.query as any;

  const client = clients.find(c => c.clientId === client_id && c.redirectUri === redirect_uri);

  if (!client) {
    return res.status(400).send('Invalid client or redirect URI');
  }

  if (response_type !== 'code') {
    return res.status(400).send('Unsupported response type');
  }

  // Simplified user authentication for example purposes
  const userLoggedIn = true;

  if (!userLoggedIn) {
    return res.status(401).send('User not authenticated');
  }

  const authCode = uuidv4();
  const redirectUriWithParams = `${redirect_uri}?${querystring.stringify({ code: authCode, state })}`;

  res.redirect(redirectUriWithParams);
};

app.get('/authorize', authorize);

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Authorization server is running on http://localhost:${PORT}`);
});

export { app, authorize };
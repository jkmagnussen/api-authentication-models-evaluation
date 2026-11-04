import express, { Request, Response } from 'express';
import { generateRandomString, generateAuthToken } from './utils'; // hypothetical utility functions

const app = express();
app.use(express.urlencoded({ extended: true }));

const clients = [
  { clientId: 'example_client_id', redirectUri: 'http://localhost:3000/callback' }
];

const authCodes: Record<string, { clientId: string, redirectUri: string }> = {};

app.get('/oauth/authorize', (req: Request, res: Response) => {
  const { response_type, client_id, redirect_uri, state } = req.query;

  if (response_type !== 'code') {
    return res.status(400).send('Invalid response_type');
  }

  const client = clients.find(c => c.clientId === client_id);
  if (!client || client.redirectUri !== redirect_uri) {
    return res.status(400).send('Invalid client_id or redirect_uri');
  }

  const authCode = generateRandomString(20);
  authCodes[authCode] = { clientId: client.clientId, redirectUri: client.redirectUri };

  const redirectUrl = `${redirect_uri}?code=${authCode}` + (state ? `&state=${state}` : '');
  res.redirect(redirectUrl);
});

app.post('/oauth/token', (req: Request, res: Response) => {
  const { grant_type, code, client_id, redirect_uri } = req.body;

  if (grant_type !== 'authorization_code') {
    return res.status(400).send('Invalid grant_type');
  }

  const authCodeData = authCodes[code];
  if (!authCodeData || authCodeData.clientId !== client_id || authCodeData.redirectUri !== redirect_uri) {
    return res.status(400).send('Invalid code, client_id, or redirect_uri');
  }

  delete authCodes[code];

  const accessToken = generateAuthToken();
  res.json({ access_token: accessToken, token_type: 'bearer' });
});

export { app };
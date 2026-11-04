import express, { Request, Response } from 'express';
import crypto from 'crypto';
import querystring from 'querystring';

const app = express();
app.use(express.json());

interface OAuthClient {
  clientId: string;
  redirectUris: string[];
  secret: string;
}

const clients: OAuthClient[] = [
  {
    clientId: 'sampleClientId',
    redirectUris: ['http://localhost:3000/callback'],
    secret: 'sampleSecret',
  },
];

const authorizationEndpoint = '/authorize';
const authorizationCodes: Record<string, string> = {};

app.get(authorizationEndpoint, (req: Request, res: Response) => {
  const clientId = req.query.client_id as string;
  const redirectUri = req.query.redirect_uri as string;
  const responseType = req.query.response_type as string;
  const state = req.query.state as string;

  const client = clients.find((client) => client.clientId === clientId);

  if (!client || !client.redirectUris.includes(redirectUri)) {
    return res.status(400).send('Invalid client request');
  }

  if (responseType !== 'code') {
    return res.status(400).send('Unsupported response type');
  }

  const authorizationCode = crypto.randomBytes(20).toString('hex');
  authorizationCodes[authorizationCode] = clientId;

  const query = querystring.stringify({
    code: authorizationCode,
    state: state,
  });

  res.redirect(`${redirectUri}?${query}`);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Authorization server running on port ${PORT}`);
});

export { app, authorizationEndpoint, clients, authorizationCodes };
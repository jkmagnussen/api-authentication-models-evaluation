import express, { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import querystring from 'querystring';

const app = express();

const clients = new Map<string, { clientSecret: string, redirectUris: string[] }>();
clients.set('client_id_example', {
  clientSecret: 'client_secret_example',
  redirectUris: ['http://localhost:3000/callback']
});

const authCodes = new Map<string, { clientId: string, redirectUri: string, scope: string }>();

const generateAuthCode = () => randomBytes(16).toString('hex');

app.get('/authorize', (req: Request, res: Response) => {
  const { response_type, client_id, redirect_uri, scope, state } = req.query;

  if (response_type !== 'code') {
    return res.status(400).send('Unsupported response type');
  }

  const client = clients.get(client_id as string);

  if (!client || !client.redirectUris.includes(redirect_uri as string)) {
    return res.status(400).send('Invalid client or redirect URI');
  }

  const authCode = generateAuthCode();
  authCodes.set(authCode, { clientId: client_id as string, redirectUri: redirect_uri as string, scope: scope as string });

  const redirectUrl = querystring.stringify({
    code: authCode,
    state: state as string
  });

  res.redirect(`${redirect_uri}?${redirectUrl}`);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Authorization server running on port ${PORT}`);
});

export { app, clients, authCodes };
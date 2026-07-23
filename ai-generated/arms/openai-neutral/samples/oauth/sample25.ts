import express, { Request, Response } from 'express';
import crypto from 'crypto';
import querystring from 'querystring';

const app = express();

let clients = [
  { clientId: 'client1', redirectUris: ['http://localhost:3000/callback'] }
];

let authorizationCodes: { [key: string]: { clientId: string, redirectUri: string, userId: string } } = {};

export function renderAuthorizationPage(req: Request, res: Response) {
  const { client_id, redirect_uri, response_type } = req.query;

  const client = clients.find(c => c.clientId === client_id);
  if (!client || !client.redirectUris.includes(redirect_uri as string) || response_type !== 'code') {
    return res.status(400).send('Invalid client or redirect URI');
  }

  res.send(`
    <form action="/authorize" method="post">
      <input type="hidden" name="client_id" value="${client.clientId}" />
      <input type="hidden" name="redirect_uri" value="${redirect_uri}" />
      <input type="submit" value="Authorize" />
    </form>
  `);
}

export function handleAuthorization(req: Request, res: Response) {
  const { client_id, redirect_uri } = req.body;
  const userId = 'user123'; // Simulating logged-in user

  const client = clients.find(c => c.clientId === client_id);
  if (!client || !client.redirectUris.includes(redirect_uri)) {
    return res.status(400).send('Invalid request');
  }

  const authorizationCode = crypto.randomBytes(20).toString('hex');
  authorizationCodes[authorizationCode] = { clientId: client_id, redirectUri: redirect_uri, userId };
  
  const query = querystring.stringify({ code: authorizationCode });
  res.redirect(`${redirect_uri}?${query}`);
}

app.get('/auth', renderAuthorizationPage);
app.post('/authorize', express.urlencoded({ extended: true }), handleAuthorization);

export default app;
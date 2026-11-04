import express, { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { URLSearchParams } from 'url';

const app = express();
app.use(express.urlencoded({ extended: true }));

const clients = new Map<string, { clientId: string, redirectUri: string }>();
clients.set('client123', { clientId: 'client123', redirectUri: 'http://localhost:4000/callback' });

const authorizationCodes = new Map<string, { clientId: string, redirectUri: string }>();

function generateAuthorizationCode() {
  return randomBytes(16).toString('hex');
}

function validateClient(clientId: string, redirectUri: string): boolean {
  const client = clients.get(clientId);
  return client ? client.redirectUri === redirectUri : false;
}

app.get('/authorize', (req: Request, res: Response) => {
  const { response_type, client_id, redirect_uri, scope, state } = req.query;

  if (
    response_type !== 'code' ||
    typeof client_id !== 'string' ||
    typeof redirect_uri !== 'string'
  ) {
    return res.status(400).send('Invalid request');
  }

  if (!validateClient(client_id, redirect_uri)) {
    return res.status(400).send('Invalid client or redirect URI');
  }

  const authorizationCode = generateAuthorizationCode();
  authorizationCodes.set(authorizationCode, { clientId: client_id, redirectUri: redirect_uri });

  const params = new URLSearchParams({
    code: authorizationCode,
    state: typeof state === 'string' ? state : '',
  });

  res.redirect(`${redirect_uri}?${params.toString()}`);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Authorization server running on http://localhost:${PORT}`);
});

export { app };
import express, { Request, Response } from 'express';
import querystring from 'querystring';

const app = express();
const PORT = 3000;

interface AuthorizationRequest {
  response_type: string;
  client_id: string;
  redirect_uri: string;
  scope: string;
  state: string;
}

const clients = new Map<string, string>();
clients.set('client_id_123', 'http://localhost/callback');

app.get('/authorize', (req: Request, res: Response) => {
  const { response_type, client_id, redirect_uri, scope, state } = req.query as AuthorizationRequest;

  if (response_type !== 'code') {
    return res.status(400).send('Unsupported response type');
  }

  if (!clients.has(client_id)) {
    return res.status(400).send('Invalid client_id');
  }

  if (clients.get(client_id) !== redirect_uri) {
    return res.status(400).send('Invalid redirect_uri');
  }

  // Assuming user is authenticated
  const authCode = 'auth_code_abc123';

  const redirectUrl = `${redirect_uri}?${querystring.stringify({
    code: authCode,
    state
  })}`;

  res.redirect(redirectUrl);
});

app.listen(PORT, () => {
  console.log(`Authorization server running on http://localhost:${PORT}`);
});

export { app };
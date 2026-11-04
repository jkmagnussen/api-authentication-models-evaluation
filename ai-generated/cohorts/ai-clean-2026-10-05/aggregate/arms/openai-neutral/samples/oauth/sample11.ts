import express, { Request, Response } from 'express';
import { URLSearchParams } from 'url';

const app = express();
const PORT = 3000;

const clients = new Map<string, { redirectUri: string }>([
  ['client_id_123', { redirectUri: 'http://localhost:4000/callback' }]
]);

app.get('/authorize', (req: Request, res: Response) => {
  const clientId = req.query.client_id as string;
  const redirectUri = req.query.redirect_uri as string;
  const responseType = req.query.response_type as string;
  const state = req.query.state as string;

  const client = clients.get(clientId);

  if (!client || client.redirectUri !== redirectUri) {
    return res.status(400).send('Invalid client_id or redirect_uri');
  }

  if (responseType !== 'code') {
    return res.status(400).send('Invalid response_type');
  }

  // Simulate user authentication and consent
  const authCode = 'sample_auth_code';

  const redirectParams = new URLSearchParams({
    code: authCode,
    state
  });

  res.redirect(`${redirectUri}?${redirectParams.toString()}`);
});

app.listen(PORT, () => {
  console.log(`Authorization server is running on http://localhost:${PORT}`);
});

export { app };
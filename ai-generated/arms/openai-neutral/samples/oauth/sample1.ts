import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

interface AuthorizationRequest {
  response_type: string;
  client_id: string;
  redirect_uri: string;
  scope: string;
  state?: string;
}

const clients = new Set<string>(['client123', 'client456']);
const validScopes = new Set<string>(['read', 'write', 'delete']);

export function authEndpoint(req: Request, res: Response) {
  const { response_type, client_id, redirect_uri, scope, state }: AuthorizationRequest = req.query as any;

  if (response_type !== 'code') {
    return res.status(400).json({ error: 'unsupported_response_type' });
  }

  if (!clients.has(client_id)) {
    return res.status(400).json({ error: 'invalid_client' });
  }

  const requestedScopes = scope.split(' ');
  if (!requestedScopes.every(s => validScopes.has(s))) {
    return res.status(400).json({ error: 'invalid_scope' });
  }

  const authCode = uuidv4();
  const redirectUrl = new URL(redirect_uri);

  redirectUrl.searchParams.append('code', authCode);
  if (state) {
    redirectUrl.searchParams.append('state', state);
  }

  res.redirect(redirectUrl.toString());
}

app.get('/authorize', authEndpoint);

export default app;
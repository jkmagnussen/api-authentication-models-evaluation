import express, { Request, Response, NextFunction } from 'express';
import { URL } from 'url';
import { randomBytes } from 'crypto';

const app = express();
app.use(express.urlencoded({ extended: true }));

type Client = {
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  scopes: string[];
};

const clients: Client[] = [
  {
    clientId: 'abc123',
    clientSecret: 'ssh-secret',
    redirectUris: ['http://localhost/callback'],
    scopes: ['read', 'write']
  }
];

function findClient(clientId: string): Client | undefined {
  return clients.find(client => client.clientId === clientId);
}

function validateRedirectUri(client: Client, redirectUri: string): boolean {
  try {
    const parsedUri = new URL(redirectUri);
    return client.redirectUris.includes(parsedUri.origin + parsedUri.pathname);
  } catch {
    return false;
  }
}

function generateCode(): string {
  return randomBytes(20).toString('hex');
}

export function authEndpoint(req: Request, res: Response, next: NextFunction): void {
  const { response_type, client_id, redirect_uri, scope, state } = req.query;

  if (typeof client_id !== 'string' || typeof redirect_uri !== 'string' || typeof response_type !== 'string') {
    res.status(400).send('Invalid request');
    return;
  }

  const client = findClient(client_id);
  if (!client || !validateRedirectUri(client, redirect_uri) || response_type !== 'code') {
    res.status(400).send('Invalid client or redirect URI');
    return;
  }

  const requestedScopes = typeof scope === 'string' ? scope.split(' ') : [];
  if (!requestedScopes.every(s => client.scopes.includes(s))) {
    res.status(400).send('Invalid scope');
    return;
  }

  const authorizationCode = generateCode();
  // Store authorizationCode with association to client and redirect_uri in a secure store (omitted for brevity)

  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.set('code', authorizationCode);
  if (typeof state === 'string') {
    redirectUrl.searchParams.set('state', state);
  }

  res.redirect(redirectUrl.toString());
}

app.get('/authorize', authEndpoint);

export const server = app;
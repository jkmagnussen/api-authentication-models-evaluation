import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { query, validationResult } from 'express-validator';

const app = express();

export const authorize = [
  query('response_type').equals('code'),
  query('client_id').isString().notEmpty(),
  query('redirect_uri').isURL(),
  query('scope').isString().notEmpty(),
  query('state').isString(),

  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid request parameters', details: errors.array() });
    }

    const { client_id, redirect_uri, scope, state } = req.query;
    const allowedScopes = ['read', 'write', 'admin'];
    const scopeArray = (scope as string).split(' ');

    if (!scopeArray.every(s => allowedScopes.includes(s))) {
      return res.status(400).json({ error: 'Invalid scope' });
    }

    const clientRedirectUri = getClientRedirectUri(client_id as string);
    if (clientRedirectUri !== redirect_uri) {
      return res.status(400).json({ error: 'Invalid redirect URI' });
    }

    const code = generateAuthorizationCode();
    storeAuthorizationCode(code, client_id as string, scopeArray);

    res.redirect(`${redirect_uri}?code=${code}&state=${state || ''}`);
  }
];

function getClientRedirectUri(clientId: string): string {
  // Mock function to fetch stored redirect URIs for clients
  const storedUris = {
    'client123': 'https://client.example.com/callback',
  };
  return storedUris[clientId] || '';
}

function generateAuthorizationCode(): string {
  return crypto.randomBytes(20).toString('hex');
}

function storeAuthorizationCode(code: string, clientId: string, scopes: string[]): void {
  // Mock function to store authorization codes securely
  console.log(`Storing code: ${code}, clientId: ${clientId}, scopes: ${scopes.join(', ')}`);
}
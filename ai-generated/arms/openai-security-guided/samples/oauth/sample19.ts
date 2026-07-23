import express, { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { query, validationResult } from 'express-validator';

const app = express();

const validClients = new Set(['client-id-123', 'client-id-456']);
const allowedRedirectUris = new Set(['https://valid-redirect-uri.com/callback']);
const validScopes = new Set(['read', 'write', 'admin']);

export interface OAuthState {
  state: string;
  redirectUri: string;
}

const stateStore: Map<string, OAuthState> = new Map();

export const authorize = [
  query('response_type').equals('code'),
  query('client_id').custom((value) => validClients.has(value)),
  query('redirect_uri').custom((value) => allowedRedirectUris.has(value)),
  query('scope').custom((value) => {
    const scopes = value.split(' ');
    return scopes.every(scope => validScopes.has(scope));
  }),
  query('state').isLength({ min: 16, max: 128 }),

  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { client_id, redirect_uri, scope, state } = req.query as Record<string, string>;

    const generatedState = randomBytes(16).toString('hex');
    stateStore.set(generatedState, { state, redirectUri: redirect_uri });

    const authorizationCode = randomBytes(20).toString('hex');

    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.set('code', authorizationCode);
    redirectUrl.searchParams.set('state', generatedState);

    res.redirect(redirectUrl.toString());
  }
];

app.get('/oauth2/authorize', authorize);

export default app;
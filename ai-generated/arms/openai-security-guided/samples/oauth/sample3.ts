import express, { Request, Response } from 'express';
import { query, validationResult } from 'express-validator';

export const oauthRouter = express.Router();

const validRedirectUris = ['https://example.com/callback'];
const validScopes = ['read', 'write', 'admin'];

oauthRouter.get('/auth', [
  query('response_type').equals('code'),
  query('client_id').isString().notEmpty(),
  query('redirect_uri').isURL(),
  query('scope').isString().custom(scope => {
    const scopes = scope.split(' ');
    return scopes.every(s => validScopes.includes(s));
  }),
  query('state').isString().optional()
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { redirect_uri, state } = req.query;

  if (!validRedirectUris.includes(redirect_uri as string)) {
    return res.status(400).json({ error: 'Invalid redirect URI' });
  }

  const authCode = generateAuthCode(); // Assume this function securely generates an auth code
  const redirectUrl = new URL(redirect_uri as string);
  redirectUrl.searchParams.append('code', authCode);
  if (state) {
    redirectUrl.searchParams.append('state', state as string);
  }

  res.redirect(redirectUrl.toString());
});

function generateAuthCode(): string {
  return Math.random().toString(36).substring(2, 15);
}
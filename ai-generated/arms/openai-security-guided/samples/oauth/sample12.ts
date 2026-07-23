import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { query, validationResult } from 'express-validator';

const router = express.Router();

const validRedirectUris = new Set(['https://trustedclient.com/callback']);
const supportedScopes = new Set(['read', 'write', 'profile']);

function generateState(): string {
  return crypto.randomBytes(16).toString('hex');
}

router.get('/oauth2/authorize', [
  query('client_id').isString(),
  query('redirect_uri').isString().custom(value => validRedirectUris.has(value)),
  query('response_type').equals('code'),
  query('scope').isString().custom(value => {
    const scopes = value.split(' ');
    return scopes.every(scope => supportedScopes.has(scope));
  }),
  query('state').optional().isString()
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { client_id, redirect_uri, scope, state } = req.query;
  const stateParam = state || generateState();

  // Simulate the user granting permission
  const authCode = crypto.randomBytes(20).toString('hex');

  const redirectUrl = new URL(redirect_uri as string);
  redirectUrl.searchParams.append('code', authCode);
  redirectUrl.searchParams.append('state', stateParam);

  res.redirect(redirectUrl.toString());
});

export { router as oauth2Router };
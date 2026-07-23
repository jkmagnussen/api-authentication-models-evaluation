import express, { Request, Response, NextFunction } from 'express';
import { query, validationResult } from 'express-validator';
import crypto from 'crypto';

export const oauthRouter = express.Router();

const validRedirectUris = new Set([
  'https://example.com/callback',
  'https://example.org/callback'
]);

const validScopes = new Set(['read', 'write', 'admin']);

oauthRouter.get('/authorize', [
  query('response_type').equals('code'),
  query('client_id').isString(),
  query('redirect_uri').custom(value => validRedirectUris.has(value)),
  query('state').isString(),
  query('scope').custom(value => value.split(' ').every(scope => validScopes.has(scope)))
], (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { response_type, client_id, redirect_uri, state, scope } = req.query;
  
  // Here you might want to check client_id against your database

  const authorizationCode = crypto.randomBytes(20).toString('hex');
  
  const redirectUrl = new URL(redirect_uri as string);
  redirectUrl.searchParams.append('code', authorizationCode);
  redirectUrl.searchParams.append('state', state as string);
  
  res.redirect(redirectUrl.toString());
});
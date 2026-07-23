import express, { Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import { randomBytes } from 'crypto';

export const authorizationRouter = express.Router();

const validRedirectUris = new Set(['https://example.com/callback']);
const validScopes = new Set(['read', 'write', 'delete']);

authorizationRouter.get('/auth', [
  query('response_type').equals('code'),
  query('client_id').isString().notEmpty(),
  query('redirect_uri').isString().custom((value) => validRedirectUris.has(value)),
  query('scope').isString().custom((value) => {
    const scopes = value.split(' ');
    return scopes.every(scope => validScopes.has(scope));
  }),
  query('state').isString().notEmpty()
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { redirect_uri, state } = req.query;
  const authorizationCode = randomBytes(16).toString('hex');

  const redirectUrl = new URL(redirect_uri as string);
  redirectUrl.searchParams.append('code', authorizationCode);
  redirectUrl.searchParams.append('state', state as string);

  res.redirect(redirectUrl.toString());
});
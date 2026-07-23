import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { check, validationResult } from 'express-validator';

export const authorizationRouter = express.Router();

const validRedirectUris = new Set<string>(['https://example.com/callback']);
const validScopes = new Set<string>(['read', 'write', 'delete']);

authorizationRouter.get('/authorize', [
  check('client_id').isString().notEmpty(),
  check('redirect_uri').isString().notEmpty(),
  check('response_type').equals('code'),
  check('scope').isString(),
  check('state').isString().optional(),
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { client_id, redirect_uri, scope, state } = req.query as Record<string, string>;

  if (!validRedirectUris.has(redirect_uri)) {
    return res.status(400).send('Invalid redirect URI');
  }

  const scopes = scope.split(' ');
  for (const sc of scopes) {
    if (!validScopes.has(sc)) {
      return res.status(400).send('Invalid scope');
    }
  }

  const code = crypto.randomBytes(16).toString('hex');
  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.append('code', code);
  if (state) {
    redirectUrl.searchParams.append('state', state);
  }

  res.redirect(redirectUrl.toString());
});
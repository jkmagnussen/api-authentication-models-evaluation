import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { check, validationResult } from 'express-validator';

const app = express();

const validRedirectURIs = new Set([
  'https://example.com/callback',
  'https://example.org/auth'
]);

const validScopes = new Set(['read', 'write', 'admin']);

app.get('/auth', [
  check('redirect_uri').isURL().custom(uri => validRedirectURIs.has(uri)),
  check('state').isString().isLength({ min: 1 }),
  check('scope').isString().isIn(Array.from(validScopes))
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { redirect_uri, state, scope } = req.query;

  const authorizationCode = crypto.randomBytes(32).toString('hex');

  const redirectUrl = new URL(redirect_uri as string);
  redirectUrl.searchParams.append('code', authorizationCode);
  redirectUrl.searchParams.append('state', state as string);

  return res.redirect(redirectUrl.toString());
});

export { app };
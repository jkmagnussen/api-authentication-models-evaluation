import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { check, validationResult } from 'express-validator';

const authRouter = express.Router();

const validRedirectUris = ['https://example.com/callback'];
const validScopes = ['read', 'write', 'admin'];

authRouter.get('/authorize', [
  check('redirect_uri').isURL(),
  check('state').isString().isLength({ min: 10, max: 128 }),
  check('scope').isString().custom(scope => {
    return scope.split(' ').every(s => validScopes.includes(s));
  }),
  check('response_type').equals('code')
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { redirect_uri, state, scope } = req.query;

  if (!validRedirectUris.includes(redirect_uri as string)) {
    return res.status(400).json({ error: 'Invalid redirect_uri' });
  }

  const authCode = crypto.randomBytes(20).toString('hex');

  const redirectUrl = new URL(redirect_uri as string);
  redirectUrl.searchParams.append('code', authCode);
  redirectUrl.searchParams.append('state', state as string);

  return res.redirect(redirectUrl.toString());
});

export { authRouter };
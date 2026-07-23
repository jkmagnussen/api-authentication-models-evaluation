import express, { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { query, validationResult } from 'express-validator';

const authRouter = express.Router();

const validRedirectUris = new Set(['https://example.com/callback']);
const supportedScopes = new Set(['read', 'write', 'profile']);

export const authorizationEndpoint = async (req: Request, res: Response) => {
  await query('redirect_uri').isURL().run(req);
  await query('state').isString().notEmpty().run(req);
  await query('scope').isString().notEmpty().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const redirectUri = req.query.redirect_uri as string;
  const state = req.query.state as string;
  const scope = req.query.scope as string;

  if (!validRedirectUris.has(redirectUri)) {
    return res.status(400).send('Invalid redirect URI');
  }

  const requestedScopes = scope.split(' ');
  for (const requestedScope of requestedScopes) {
    if (!supportedScopes.has(requestedScope)) {
      return res.status(400).send('Invalid scope');
    }
  }

  const authCode = randomBytes(32).toString('hex');

  // Simulate storing authCode, associated redirectUri, etc., in a secure store
  // storeAuthCode(authCode, redirectUri, state, requestedScopes);

  const redirectParams = new URLSearchParams({ code: authCode, state }).toString();
  return res.redirect(`${redirectUri}?${redirectParams}`);
};

authRouter.get('/authorize', authorizationEndpoint);

export default authRouter;
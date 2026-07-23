import express, { Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import crypto from 'crypto';

const authRouter = express.Router();

const validRedirectUris = new Set(['https://client.example.com/callback']);
const supportedScopes = new Set(['read', 'write', 'delete']);

authRouter.get('/authorize',
  query('response_type').equals('code'),
  query('client_id').isString(),
  query('redirect_uri').isString(),
  query('state').isString(),
  query('scope').isString(),
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { client_id, redirect_uri, state, scope } = req.query;

    if (!validRedirectUris.has(redirect_uri as string)) {
      return res.status(400).send('Invalid redirect URI');
    }

    const requestedScopes = (scope as string).split(' ');
    const invalidScopes = requestedScopes.some(s => !supportedScopes.has(s));
    if (invalidScopes) {
      return res.status(400).send('Invalid scope');
    }

    const authorizationCode = crypto.randomBytes(16).toString('hex');
    const redirectUrl = new URL(redirect_uri as string);
    redirectUrl.searchParams.append('code', authorizationCode);
    redirectUrl.searchParams.append('state', state as string);

    res.redirect(302, redirectUrl.toString());
  }
);

export { authRouter };
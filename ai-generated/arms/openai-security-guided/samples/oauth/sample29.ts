import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';

const router = express.Router();

const validRedirectUris = new Set(['https://trustedclient.com/callback']);
const allowedScopes = new Set(['read', 'write', 'admin']);

export const authorizationEndpoint = router.post(
  '/authorize',
  [
    body('response_type').equals('code'),
    body('client_id').isString().notEmpty(),
    body('redirect_uri').isURL(),
    body('scope').isString().notEmpty(),
    body('state').isString().optional(),
  ],
  (req: Request, res: Response): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { client_id, redirect_uri, scope, state } = req.body;

    if (!validRedirectUris.has(redirect_uri)) {
      return res.status(400).json({ error: 'Invalid redirect URI' });
    }

    const requestedScopes = scope.split(' ');
    const invalidScopes = requestedScopes.filter(scope => !allowedScopes.has(scope));
    if (invalidScopes.length > 0) {
      return res.status(400).json({ error: 'Invalid scopes requested' });
    }

    const code = crypto.randomBytes(20).toString('hex');

    const responseParams = new URLSearchParams({ code });
    if (state) {
      responseParams.append('state', state);
    }

    res.redirect(`${redirect_uri}?${responseParams.toString()}`);
  }
);
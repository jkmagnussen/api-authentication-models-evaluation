import express, { Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import crypto from 'crypto';

export const oauthRouter = express.Router();

const VALID_REDIRECT_URIS = new Set([
  'https://yourapp.com/callback',
  'https://yourapp.com/another-callback'
]);

const VALID_SCOPES = new Set(['read', 'write', 'admin']);

oauthRouter.get('/authorize',
  query('response_type').equals('code'),
  query('client_id').isString(),
  query('redirect_uri').isString().custom((uri) => VALID_REDIRECT_URIS.has(uri)),
  query('scope').isString().custom((scope) => {
    const scopes = scope.split(' ');
    return scopes.every(s => VALID_SCOPES.has(s));
  }),
  query('state').optional().isString(),
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { client_id, redirect_uri, scope, state } = req.query;
    const code = crypto.randomBytes(20).toString('hex');

    let redirectUrl = new URL(redirect_uri as string);
    redirectUrl.searchParams.append('code', code);
    if (state) {
      redirectUrl.searchParams.append('state', state as string);
    }

    // Here you would save the authorization code and related data in your database

    res.redirect(redirectUrl.toString());
  }
);
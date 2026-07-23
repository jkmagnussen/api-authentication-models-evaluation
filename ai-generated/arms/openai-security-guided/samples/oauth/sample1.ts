import express, { Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import crypto from 'crypto';

const app = express();

export const oauth2AuthEndpoint = async (req: Request, res: Response) => {
  await Promise.all([
    query('client_id').exists().isString().run(req),
    query('redirect_uri').exists().isURL().run(req),
    query('scope').exists().isString().run(req),
    query('state').exists().isString().run(req),
  ]);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid request', details: errors.array() });
  }

  const { client_id, redirect_uri, scope, state } = req.query;

  const validRedirectUris = ['https://trustedapp.com/callback'];
  if (!validRedirectUris.includes(redirect_uri as string)) {
    return res.status(400).json({ error: 'Invalid redirect URI' });
  }

  const availableScopes = ['read', 'write'];
  const requestedScopes = (scope as string).split(' ');
  if (!requestedScopes.every(s => availableScopes.includes(s))) {
    return res.status(400).json({ error: 'Invalid scope' });
  }

  const stateToken = req.session ? req.session.stateToken : undefined;
  if (!crypto.timingSafeEqual(Buffer.from(state as string), Buffer.from(stateToken || ''))) {
    return res.status(400).json({ error: 'Invalid state parameter' });
  }

  res.redirect(`${redirect_uri}?code=AUTH_CODE&state=${state}`);
};

app.get('/authorize', oauth2AuthEndpoint);

export default app;
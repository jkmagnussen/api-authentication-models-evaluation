import express, { Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import crypto from 'crypto';

const app = express();

type AuthRequest = {
  response_type: string;
  client_id: string;
  redirect_uri: string;
  scope?: string;
  state?: string;
};

const validResponseTypes = ['code'];

const validateAuthRequest = [
  query('response_type').exists().isIn(validResponseTypes),
  query('client_id').exists().isString(),
  query('redirect_uri').exists().isURL(),
  query('scope').optional().isString(),
  query('state').optional().isString(),
];

app.get('/oauth/authorize', validateAuthRequest, (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid request parameters', details: errors.array() });
  }

  const { response_type, client_id, redirect_uri, state } = req.query as AuthRequest;

  const code = crypto.randomBytes(16).toString('hex');

  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.set('code', code);
  if (state) {
    redirectUrl.searchParams.set('state', state);
  }

  res.redirect(redirectUrl.toString());
});

export { app };
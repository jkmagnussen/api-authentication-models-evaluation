import express, { Request, Response } from 'express';
import crypto from 'crypto';

interface OAuthRequestQuery {
  response_type: string;
  client_id: string;
  redirect_uri: string;
  scope?: string;
  state?: string;
}

interface TokenStore {
  [key: string]: string;
}

const authorizeRouter = express.Router();
const tokenDatabase: TokenStore = {};

authorizeRouter.get('/authorize', (req: Request<{}, {}, {}, OAuthRequestQuery>, res: Response) => {
  const { response_type, client_id, redirect_uri, scope, state } = req.query;

  if (response_type !== 'code') {
    return res.status(400).send('Unsupported response type');
  }

  if (!client_id || !redirect_uri) {
    return res.status(400).send('Missing parameters');
  }

  const authorizationCode = crypto.randomBytes(16).toString('hex');
  tokenDatabase[authorizationCode] = client_id;

  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.append('code', authorizationCode);
  if (state) redirectUrl.searchParams.append('state', state);

  return res.redirect(redirectUrl.toString());
});

export { authorizeRouter, tokenDatabase };
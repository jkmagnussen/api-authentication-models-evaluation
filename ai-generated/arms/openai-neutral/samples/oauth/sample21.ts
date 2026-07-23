import express, { Request, Response } from 'express';
import { generateAuthCode, validateClient, validateRedirectUri } from './auth-utils';

const authRouter = express.Router();

authRouter.get('/authorize', (req: Request, res: Response) => {
  const { response_type, client_id, redirect_uri, scope, state } = req.query;

  if (response_type !== 'code') {
    return res.status(400).send('Unsupported response type.');
  }

  if (!validateClient(client_id as string)) {
    return res.status(400).send('Invalid client ID.');
  }

  if (!validateRedirectUri(client_id as string, redirect_uri as string)) {
    return res.status(400).send('Invalid redirect URI.');
  }

  // Simulate user login session check
  const user = { id: 'user123', name: 'John Doe' }; // This should come from session/auth middleware
  if (!user) {
    return res.redirect(`/login?redirect=${req.originalUrl}`);
  }

  const authCode = generateAuthCode(user.id, client_id as string, scope as string);

  const redirectUrl = new URL(redirect_uri as string);
  redirectUrl.searchParams.append('code', authCode);
  if (state) {
    redirectUrl.searchParams.append('state', state as string);
  }

  res.redirect(redirectUrl.toString());
});

export { authRouter };
import express, { Request, Response } from 'express';
import { generateAuthCode, validateClient, storeAuthCode } from './authUtils';

const router = express.Router();

router.get('/oauth2/authorize', (req: Request, res: Response) => {
  const { client_id, redirect_uri, response_type, state, scope } = req.query;

  if (!client_id || !redirect_uri || !response_type || response_type !== 'code') {
    return res.status(400).json({ error: 'invalid_request' });
  }

  if (!validateClient(client_id as string, redirect_uri as string)) {
    return res.status(401).json({ error: 'unauthorized_client' });
  }

  // Assuming user authentication is handled elsewhere
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'access_denied' });
  }

  const authCode = generateAuthCode(user.id, client_id as string, scope as string);

  storeAuthCode(authCode, user.id, client_id as string);

  const redirectUrl = new URL(redirect_uri as string);
  redirectUrl.searchParams.append('code', authCode);
  if (state) {
    redirectUrl.searchParams.append('state', state as string);
  }

  return res.redirect(redirectUrl.toString());
});

export { router as authRouter };
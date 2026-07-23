import express, { Request, Response } from 'express';
import { generateAuthCode, verifyClient, saveAuthCode } from './authUtils';
import { authenticateUser } from './userAuth';

export const oauthRouter = express.Router();

oauthRouter.get('/authorize', authenticateUser, async (req: Request, res: Response) => {
  const { client_id, response_type, redirect_uri, scope, state } = req.query;

  if (!client_id || response_type !== 'code' || !redirect_uri) {
    return res.status(400).json({ error: 'invalid_request' });
  }

  try {
    const isClientValid = await verifyClient(client_id as string, redirect_uri as string);
    if (!isClientValid) {
      return res.status(400).json({ error: 'unauthorized_client' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'access_denied' });
    }

    const authorizationCode = generateAuthCode();
    await saveAuthCode(authorizationCode, client_id as string, req.user.id, scope as string);

    const redirectUrl = new URL(redirect_uri as string);
    redirectUrl.searchParams.append('code', authorizationCode);
    if (state) redirectUrl.searchParams.append('state', state as string);

    res.redirect(redirectUrl.toString());
  } catch (error) {
    res.status(500).json({ error: 'server_error' });
  }
});
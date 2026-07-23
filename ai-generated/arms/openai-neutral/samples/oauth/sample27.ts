import express, { Request, Response } from 'express';
import { generateRandomString, getClient, getAuthCode, saveAuthCode } from './authUtils';

export const createAuthEndpoint = () => {
  const router = express.Router();

  router.get('/authorize', (req: Request, res: Response) => {
    const { response_type, client_id, redirect_uri, state } = req.query;

    if (response_type !== 'code') {
      return res.status(400).json({ error: 'unsupported_response_type' });
    }

    const client = getClient(client_id as string);
    if (!client) {
      return res.status(400).json({ error: 'invalid_client' });
    }

    if (client.redirectUri !== redirect_uri) {
      return res.status(400).json({ error: 'invalid_redirect_uri' });
    }

    const authCode = generateRandomString(16);
    saveAuthCode(authCode, client_id as string);

    const redirectUrl = new URL(redirect_uri as string);
    redirectUrl.searchParams.set('code', authCode);
    if (state) {
      redirectUrl.searchParams.set('state', state as string);
    }

    res.redirect(redirectUrl.toString());
  });

  return router;
};
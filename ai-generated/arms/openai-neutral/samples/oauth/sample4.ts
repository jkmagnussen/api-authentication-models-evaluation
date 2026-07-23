import express, { Request, Response } from 'express';
import { generateAuthorizationCode, validateClient, storeAuthorizationCode } from './authService';
import { OAuth2Client, AuthorizationRequest } from './types';

const authRouter = express.Router();

authRouter.get('/authorize', async (req: Request, res: Response) => {
  const { response_type, client_id, redirect_uri, scope, state } = req.query as AuthorizationRequest;

  try {
    if (!response_type || response_type !== 'code') {
      return res.status(400).json({ error: 'unsupported_response_type' });
    }

    const client: OAuth2Client | null = await validateClient(client_id, redirect_uri);
    if (!client) {
      return res.status(400).json({ error: 'invalid_client' });
    }

    const authorizationCode = generateAuthorizationCode();
    await storeAuthorizationCode(authorizationCode, client_id, redirect_uri, scope);

    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.append('code', authorizationCode);
    if (state) {
      redirectUrl.searchParams.append('state', state);
    }

    res.redirect(redirectUrl.toString());
  } catch (error) {
    res.status(500).json({ error: 'server_error' });
  }
});

export { authRouter };
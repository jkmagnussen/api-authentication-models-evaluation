import express, { Request, Response } from 'express';
import { generateAuthorizationCode, validateClient, redirectUriMatches } from './oauthUtils';

const router = express.Router();

interface AuthRequest extends Request {
  query: {
    response_type: string;
    client_id: string;
    redirect_uri: string;
    state?: string;
    scope?: string;
  };
}

export const authorizeHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  const { response_type, client_id, redirect_uri, state, scope } = req.query;

  if (response_type !== 'code') {
    return res.status(400).json({ error: 'unsupported_response_type' });
  }

  const client = await validateClient(client_id);
  if (!client) {
    return res.status(400).json({ error: 'invalid_client' });
  }

  if (!redirectUriMatches(redirect_uri, client.redirectUris)) {
    return res.status(400).json({ error: 'invalid_redirect_uri' });
  }

  const authCode = generateAuthorizationCode(client_id, scope || '');

  const queryParams: Record<string, string> = { code: authCode };
  if (state) {
    queryParams.state = state;
  }

  const redirectUrl = new URL(redirect_uri);
  Object.entries(queryParams).forEach(([key, value]) => redirectUrl.searchParams.append(key, value));

  res.redirect(redirectUrl.toString());
};

router.get('/authorize', authorizeHandler);

export { router as authorizationRouter };
import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const authorizationRouter = express.Router();

const clients = new Map<string, { redirectUri: string, clientSecret: string }>();
clients.set('client123', { redirectUri: 'http://localhost:3000/callback', clientSecret: 'secret123' });

const authorizationCodes = new Map<string, { clientId: string, redirectUri: string, userId: string }>();

authorizationRouter.get('/authorize', (req: Request, res: Response) => {
  const { response_type, client_id, redirect_uri, state } = req.query;

  if (response_type !== 'code' || typeof client_id !== 'string' || typeof redirect_uri !== 'string') {
    return res.status(400).json({ error: 'invalid_request' });
  }

  const client = clients.get(client_id);
  if (!client || client.redirectUri !== redirect_uri) {
    return res.status(400).json({ error: 'unauthorized_client' });
  }

  const authorizationCode = uuidv4();
  authorizationCodes.set(authorizationCode, { clientId: client_id, redirectUri: redirect_uri, userId: 'user123' });

  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.append('code', authorizationCode);
  if (state) {
    redirectUrl.searchParams.append('state', state as string);
  }

  res.redirect(redirectUrl.toString());
});

export { authorizationRouter };
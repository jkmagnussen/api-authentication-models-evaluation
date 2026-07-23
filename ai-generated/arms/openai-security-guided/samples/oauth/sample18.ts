import express, { Request, Response } from 'express';
import { validateRedirectUri, generateState, validateScopes } from './authUtils';

export const authRouter = express.Router();

authRouter.get('/authorize', (req: Request, res: Response) => {
  const clientId = req.query.client_id as string;
  const redirectUri = req.query.redirect_uri as string;
  const scope = req.query.scope as string;
  const state = req.query.state as string;

  if (!clientId || !validateRedirectUri(clientId, redirectUri)) {
    return res.status(400).json({ error: 'Invalid redirect URI' });
  }

  if (!validateScopes(scope)) {
    return res.status(400).json({ error: 'Invalid scope' });
  }

  const generatedState = state || generateState();

  res.redirect(`${redirectUri}?state=${generatedState}&scope=${encodeURIComponent(scope)}`);
});
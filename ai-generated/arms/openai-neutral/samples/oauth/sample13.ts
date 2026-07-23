import express, { Request, Response } from 'express';
import { generateAccessToken, validateClient } from './authService';
import { authorizeUser, getRedirectUri } from './oauthUtils';

const oauthRouter = express.Router();

oauthRouter.post('/authorize', async (req: Request, res: Response) => {
  try {
    const clientId = req.body.client_id;
    const redirectUri = req.body.redirect_uri;
    const responseType = req.body.response_type;
    const scope = req.body.scope;
    const state = req.body.state;

    if (!clientId || !redirectUri || !responseType) {
      return res.status(400).send('Missing required parameters');
    }

    const clientIsValid = await validateClient(clientId, redirectUri);
    if (!clientIsValid) {
      return res.status(401).send('Invalid client');
    }

    const user = await authorizeUser(req, res);
    if (!user) {
      return res.status(403).send('User authorization failed');
    }

    if (responseType === 'code') {
      const authorizationCode = generateAccessToken(user, clientId, scope);
      const redirectUrl = getRedirectUri(redirectUri, authorizationCode, state);
      return res.redirect(redirectUrl);
    } else {
      return res.status(400).send('Unsupported response type');
    }
  } catch (error) {
    return res.status(500).send('Internal server error');
  }
});

export { oauthRouter };
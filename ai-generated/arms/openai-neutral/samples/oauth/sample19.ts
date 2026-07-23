import express, { Request, Response } from 'express';
import { parse } from 'url';
import { generateAuthCode, validateClient, getRedirectUri } from './authService';

export const authRouter = express.Router();

authRouter.get('/authorize', async (req: Request, res: Response) => {
  const { response_type, client_id, redirect_uri, scope, state } = req.query;

  if (!response_type || response_type !== 'code') {
    return res.status(400).send('Invalid or missing response_type');
  }

  const clientValid = await validateClient(client_id as string, redirect_uri as string);
  if (!clientValid) {
    return res.status(400).send('Invalid client_id or redirect_uri');
  }

  const authorizationCode = await generateAuthCode(client_id as string, scope as string);
  const validRedirectUri = await getRedirectUri(client_id as string);

  const redirectUrl = parse(validRedirectUri);
  redirectUrl.query = {
    code: authorizationCode,
    state: state as string
  };

  res.redirect(redirectUrl.format());
});
import express, { Request, Response } from 'express';
import { generateAuthCode, validateClient, saveAuthCode } from './authUtils';

const router = express.Router();

router.get('/authorize', async (req: Request, res: Response) => {
  const { client_id, redirect_uri, scope, response_type, state } = req.query;

  if (!client_id || !redirect_uri || !scope || !response_type) {
    return res.status(400).send('Invalid request');
  }

  if (!validateClient(client_id as string, redirect_uri as string)) {
    return res.status(401).send('Unauthorized client');
  }

  if (response_type !== 'code') {
    return res.status(400).send('Unsupported response type');
  }

  // Here you would normally authenticate the user
  // For this example, assume the user has been authenticated

  const authCode = generateAuthCode(client_id as string, scope as string);
  saveAuthCode(authCode, client_id as string);

  const redirectUrl = `${redirect_uri}?code=${authCode}${state ? `&state=${state}` : ''}`;
  res.redirect(redirectUrl);
});

export { router as authRouter };
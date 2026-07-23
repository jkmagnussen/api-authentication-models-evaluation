import express, { Request, Response } from 'express';
import { generateAuthorizationCode, validateClient, storeAuthorizationCode } from './auth-utils';

const router = express.Router();

router.get('/oauth2/auth', async (req: Request, res: Response) => {
  const { client_id, redirect_uri, response_type, scope, state } = req.query;

  if (!client_id || !redirect_uri || !response_type || response_type !== 'code') {
    return res.status(400).send('Invalid request parameters.');
  }

  const clientValid = await validateClient(client_id as string, redirect_uri as string);
  if (!clientValid) {
    return res.status(400).send('Client validation failed.');
  }

  const authCode = generateAuthorizationCode({ client_id: client_id as string, scope: scope as string[] });
  await storeAuthorizationCode(authCode, client_id as string, redirect_uri as string, scope as string[]);

  const redirectUrl = new URL(redirect_uri as string);
  redirectUrl.searchParams.append('code', authCode);
  if (state) {
    redirectUrl.searchParams.append('state', state as string);
  }

  res.redirect(redirectUrl.toString());
});

export { router };
import express, { Request, Response } from 'express';
import { generateAuthToken, validateClient, generateAuthorizationCode } from './authUtils';

const app = express();

export const authorizeUser = async (req: Request, res: Response): Promise<void> => {
  const { response_type, client_id, redirect_uri, scope, state } = req.query;

  if (!response_type || !client_id || !redirect_uri) {
    res.status(400).send('Missing required parameters');
    return;
  }

  const clientValid = await validateClient(client_id as string, redirect_uri as string);
  if (!clientValid) {
    res.status(401).send('Invalid client or redirect URI');
    return;
  }

  if (response_type !== 'code') {
    res.status(400).send('Unsupported response type');
    return;
  }

  const authorizationCode = generateAuthorizationCode(client_id as string, redirect_uri as string, scope as string);
  const redirectUrl = `${redirect_uri}?code=${authorizationCode}&state=${state}`;

  res.redirect(redirectUrl);
};

app.get('/oauth2/authorize', authorizeUser);
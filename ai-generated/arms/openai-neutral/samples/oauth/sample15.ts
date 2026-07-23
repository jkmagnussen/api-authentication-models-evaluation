import express, { Request, Response } from 'express';
import { generateAccessToken, validateClient, redirectError } from './authUtils';

const router = express.Router();

export const oauth2AuthorizationEndpoint = (req: Request, res: Response): void => {
  const { response_type, client_id, redirect_uri, scope, state } = req.query;

  if (!validateClient(client_id as string, redirect_uri as string)) {
    return redirectError(res, redirect_uri as string, 'invalid_client', state as string);
  }

  if (response_type !== 'code') {
    return redirectError(res, redirect_uri as string, 'unsupported_response_type', state as string);
  }

  const authorizationCode = generateAccessToken();
  res.redirect(`${redirect_uri}?code=${authorizationCode}&state=${state}`);
};

router.get('/authorize', oauth2AuthorizationEndpoint);

export default router;
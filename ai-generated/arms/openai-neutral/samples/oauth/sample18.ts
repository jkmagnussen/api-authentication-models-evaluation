import express, { Request, Response, NextFunction } from 'express';
import { generateAuthorizationCode, validateClientCredentials, buildAuthResponseUri } from './authUtils';

const router = express.Router();

export const oauthAuthorize = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { client_id, redirect_uri, response_type, scope, state } = req.query;
    if (!client_id || !redirect_uri || !response_type) {
      return res.status(400).json({ error: 'invalid_request' });
    }

    if (!validateClientCredentials(client_id as string, redirect_uri as string)) {
      return res.status(401).json({ error: 'unauthorized_client' });
    }

    if (response_type !== 'code') {
      return res.status(400).json({ error: 'unsupported_response_type' });
    }

    const code = generateAuthorizationCode(client_id as string, scope as string);
    const redirectUrl = buildAuthResponseUri(redirect_uri as string, code, state as string);

    res.redirect(redirectUrl);
  } catch (err) {
    next(err);
  }
};

router.get('/oauth2/authorize', oauthAuthorize);
export default router;
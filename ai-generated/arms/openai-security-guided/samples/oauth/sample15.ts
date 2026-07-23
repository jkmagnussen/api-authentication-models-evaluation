import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { URL } from 'url';

const router = express.Router();

export const getOAuth2Authorize = (req: Request, res: Response) => {
  const { client_id, redirect_uri, response_type, state, scope } = req.query;

  if (typeof client_id !== 'string' || typeof redirect_uri !== 'string' || typeof response_type !== 'string') {
    return res.status(400).json({ error: 'invalid_request' });
  }

  const allowedRedirects = ['https://example.com/callback'];
  const validScopes = ['read', 'write'];

  try {
    const uri = new URL(redirect_uri);
    if (!allowedRedirects.includes(uri.origin)) {
      return res.status(400).json({ error: 'invalid_redirect_uri' });
    }
  } catch (e) {
    return res.status(400).json({ error: 'invalid_redirect_uri' });
  }

  if (response_type !== 'code') {
    return res.status(400).json({ error: 'unsupported_response_type' });
  }

  if (scope) {
    const requestedScopes = scope.split(' ');
    for (const s of requestedScopes) {
      if (!validScopes.includes(s)) {
        return res.status(400).json({ error: 'invalid_scope' });
      }
    }
  }

  const authorizationCode = crypto.randomBytes(20).toString('hex');

  const params = new URLSearchParams();
  params.append('code', authorizationCode);
  if (typeof state === 'string') {
    params.append('state', state);
  }

  res.redirect(`${redirect_uri}?${params.toString()}`);
};

router.get('/authorize', getOAuth2Authorize);

export default router;
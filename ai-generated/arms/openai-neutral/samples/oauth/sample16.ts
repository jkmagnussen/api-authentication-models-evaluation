import express, { Request, Response } from 'express';
import { randomBytes } from 'crypto';

const authRouter = express.Router();

interface AuthRequest extends Request {
  query: {
    response_type: string;
    client_id: string;
    redirect_uri: string;
    scope?: string;
    state?: string;
  };
}

authRouter.get('/authorize', (req: AuthRequest, res: Response) => {
  const { response_type, client_id, redirect_uri, scope, state } = req.query;

  if (response_type !== 'code') {
    return res.status(400).json({ error: 'unsupported_response_type' });
  }

  if (!client_id || !redirect_uri) {
    return res.status(400).json({ error: 'invalid_request' });
  }

  // Simulate user login and authorization
  const authorizationCode = randomBytes(20).toString('hex');

  let redirectURL = `${redirect_uri}?code=${authorizationCode}`;
  if (state) {
    redirectURL += `&state=${state}`;
  }

  res.redirect(redirectURL);
});

export { authRouter };
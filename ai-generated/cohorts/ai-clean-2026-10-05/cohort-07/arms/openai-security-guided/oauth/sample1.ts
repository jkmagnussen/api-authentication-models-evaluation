import express, { Request, Response, NextFunction } from 'express';
import { check, validationResult } from 'express-validator';
import crypto from 'crypto';

const router = express.Router();

interface Client {
  clientId: string;
  redirectUris: string[];
  clientSecret: string;
}

const clients: Client[] = [
  {
    clientId: 'client123',
    redirectUris: ['https://example.com/callback'],
    clientSecret: 'supersecret'
  }
];

interface AuthorizationRequest {
  responseType: string;
  clientId: string;
  redirectUri: string;
  state?: string;
}

router.get('/authorize', [
  check('response_type').equals('code'),
  check('client_id').isString(),
  check('redirect_uri').isString(),
  check('state').optional().isString()
], validateInputs, (req: Request, res: Response) => {
  const { response_type, client_id, redirect_uri, state } = req.query as AuthorizationRequest;

  const client = clients.find(c => c.clientId === client_id);
  if (!client || !client.redirectUris.includes(redirect_uri)) {
    return res.status(400).json({ error: 'invalid_request' });
  }

  const authorizationCode = crypto.randomBytes(16).toString('hex');

  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.append('code', authorizationCode);
  if (state) {
    redirectUrl.searchParams.append('state', state);
  }

  res.redirect(302, redirectUrl.toString());
});

function validateInputs(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'invalid_request', details: errors.array() });
  }
  next();
}

export { router as authRouter };
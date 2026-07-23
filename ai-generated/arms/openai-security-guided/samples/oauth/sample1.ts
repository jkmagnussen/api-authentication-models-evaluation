import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';

const router = express.Router();

interface OAuth2Request extends Request {
  query: {
    response_type?: string;
    client_id?: string;
    redirect_uri?: string;
    scope?: string;
    state?: string;
  };
}

const VALID_SCOPES = ['read', 'write', 'admin'];
const VALID_CLIENT_IDS = ['client_123', 'client_456'];
const REDIRECT_URI_WHITELIST = ['https://client.example.com/callback'];

router.get('/authorize', [
  body('response_type').equals('code').withMessage('Invalid response type. Expected "code".'),
  body('client_id').isIn(VALID_CLIENT_IDS).withMessage('Invalid client ID.'),
  body('redirect_uri').custom((value) => {
    if (!REDIRECT_URI_WHITELIST.includes(value)) {
      throw new Error('Invalid redirect URI.');
    }
    return true;
  }),
  body('scope').custom((value) => {
    const scopes = value.split(' ');
    for (const scope of scopes) {
      if (!VALID_SCOPES.includes(scope)) {
        throw new Error(`Invalid scope: ${scope}`);
      }
    }
    return true;
  }),
  body('state').optional().isString().withMessage('State must be a string.'),
], (req: OAuth2Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { client_id, redirect_uri, state } = req.query;
  const authorizationCode = crypto.randomBytes(32).toString('hex');

  let redirectUrl = `${redirect_uri}?code=${authorizationCode}`;
  if (state) {
    redirectUrl += `&state=${encodeURIComponent(state)}`;
  }

  res.redirect(redirectUrl);
});

export { router as authRouter };
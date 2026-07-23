import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { check, validationResult } from 'express-validator';

const router = express.Router();

const VALID_REDIRECT_URIS = ['https://example.com/callback'];
const VALID_SCOPES = ['read', 'write'];

export const authorize = router.post(
  '/authorize',
  [
    check('client_id').isString(),
    check('redirect_uri').isURL(),
    check('state').isString().optional(),
    check('scope').isString().custom((value) => {
      const requestedScopes = value.split(' ');
      return requestedScopes.every(scope => VALID_SCOPES.includes(scope));
    })
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { client_id, redirect_uri, state, scope } = req.body;

    if (!VALID_REDIRECT_URIS.includes(redirect_uri)) {
      return res.status(400).send('Invalid redirect URI');
    }

    const code = crypto.randomBytes(20).toString('hex');

    let redirectTo = `${redirect_uri}?code=${code}`;
    if (state) {
      redirectTo += `&state=${state}`;
    }

    res.status(302).redirect(redirectTo);
  }
);

export default router;
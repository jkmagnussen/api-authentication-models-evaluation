import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { checkSchema, validationResult } from 'express-validator';

const router = express.Router();

const validRedirectUris = ['https://example.com/callback', 'https://another.com/return'];
const supportedScopes = ['read', 'write', 'delete'];

router.get('/authorize', checkSchema({
  client_id: { in: ['query'], isString: true },
  redirect_uri: {
    in: ['query'],
    isString: true,
    custom: {
      options: (value) => validRedirectUris.includes(value),
      errorMessage: 'Invalid redirect URI.'
    }
  },
  response_type: {
    in: ['query'],
    equals: { options: ['code'], errorMessage: 'Unsupported response type.' }
  },
  scope: {
    in: ['query'],
    isString: true,
    custom: {
      options: (value) => {
        const scopes = value.split(' ');
        return scopes.every(scope => supportedScopes.includes(scope));
      },
      errorMessage: 'Invalid scope.'
    }
  },
  state: { in: ['query'], optional: true, isString: true }
}), (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { client_id, redirect_uri, state } = req.query;
  const authorizationCode = crypto.randomBytes(20).toString('hex');

  const redirectUrl = new URL(redirect_uri as string);
  redirectUrl.searchParams.append('code', authorizationCode);
  if (state) {
    redirectUrl.searchParams.append('state', state as string);
  }

  res.redirect(redirectUrl.toString());
});

export { router as oauthRouter };
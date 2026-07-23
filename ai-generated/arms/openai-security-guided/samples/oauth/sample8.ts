import express, { Request, Response } from 'express';
import { URL } from 'url';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';

const router = express.Router();

const ALLOWED_REDIRECT_URIS = new Set(['https://example.com/callback']);
const ALLOWED_SCOPES = new Set(['read', 'write']);

function validateRedirectUri(uri: string): boolean {
  try {
    const parsedUrl = new URL(uri);
    return ALLOWED_REDIRECT_URIS.has(parsedUrl.origin + parsedUrl.pathname);
  } catch {
    return false;
  }
}

function validateScopes(scopes: string[]): boolean {
  return scopes.every(scope => ALLOWED_SCOPES.has(scope));
}

router.post('/authorize', 
  body('response_type').equals('code'),
  body('client_id').isString(),
  body('redirect_uri').custom(validateRedirectUri),
  body('state').isString(),
  body('scope').custom(value => {
    const requestedScopes = value.split(' ');
    return validateScopes(requestedScopes);
  }),
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { client_id, redirect_uri, state, scope } = req.body;
    const code = crypto.randomBytes(16).toString('hex');

    // Simulate storing the authorization code and its associated data
    // In a real implementation, this data should be persisted securely
    // Store in-memory for this example
    const authorizationCodes = new Map();
    authorizationCodes.set(code, { client_id, redirect_uri, scope });

    const url = new URL(redirect_uri);
    url.searchParams.set('code', code);
    url.searchParams.set('state', state);

    res.redirect(url.toString());
  }
);

export { router as authorizationRouter };
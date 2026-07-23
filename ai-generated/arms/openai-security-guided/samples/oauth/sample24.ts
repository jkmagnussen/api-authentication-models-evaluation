import { Request, Response, Router } from 'express';
import { query, validationResult } from 'express-validator';
import crypto from 'crypto';

const authRouter = Router();

export const generateState = (): string => {
  return crypto.randomBytes(24).toString('hex');
};

const isValidRedirectUri = (redirectUri: string): boolean => {
  const allowedRedirects = ['https://example.com/callback', 'https://example.org/return'];
  return allowedRedirects.includes(redirectUri);
};

const validateScopes = (scopes: string[]): boolean => {
  const acceptedScopes = ['read', 'write', 'delete'];
  return scopes.every(scope => acceptedScopes.includes(scope));
};

authRouter.get('/authorize', [
  query('client_id').isString().notEmpty(),
  query('redirect_uri').isString().notEmpty(),
  query('response_type').equals('code'),
  query('state').isString().notEmpty(),
  query('scope').isString().notEmpty().custom(value => {
    const scopes = value.split(' ');
    return validateScopes(scopes);
  })
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { client_id, redirect_uri, response_type, state, scope } = req.query;

  if (!isValidRedirectUri(redirect_uri as string)) {
    return res.status(400).send('Invalid redirect URI');
  }

  const generatedState = generateState();
  // Here, you would typically store the state and client_id in the session or database
  // For this example, we're assuming a successful authorization process
  const authorizationCode = crypto.randomBytes(12).toString('hex');

  res.redirect(`${redirect_uri}?code=${authorizationCode}&state=${generatedState}`);
});

export { authRouter };
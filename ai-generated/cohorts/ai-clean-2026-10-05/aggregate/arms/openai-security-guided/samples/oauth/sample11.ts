import express, { Request, Response, NextFunction } from 'express';
import { query, validationResult } from 'express-validator';
import crypto from 'crypto';

const router = express.Router();

// Mock function to validate client ID
const isValidClientId = (clientId: string): boolean => {
  const validClientIds = ['client123', 'client456'];
  return validClientIds.includes(clientId);
};

// Mock function to validate redirect URI
const isValidRedirectUri = (redirectUri: string): boolean => {
  const validRedirectUris = ['https://client.example.com/callback'];
  return validRedirectUris.includes(redirectUri);
};

// Secure random state generator
const generateState = (): string => {
  return crypto.randomBytes(16).toString('hex');
};

router.get('/authorize', [
  query('response_type').equals('code').withMessage('Invalid response_type, must be "code"'),
  query('client_id').custom(isValidClientId).withMessage('Invalid client_id'),
  query('redirect_uri').custom(isValidRedirectUri).withMessage('Invalid redirect_uri'),
  query('scope').notEmpty().withMessage('Scope is required'),
  query('state').optional().isString().withMessage('Invalid state format')
], (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { client_id, redirect_uri, scope, state } = req.query;
  const authorizationCode = crypto.randomBytes(20).toString('hex');
  const responseState = state || generateState();
  
  const redirectTo = new URL(redirect_uri as string);
  redirectTo.searchParams.append('code', authorizationCode);
  redirectTo.searchParams.append('state', responseState);
  
  return res.redirect(redirectTo.toString());
});

const app = express();
app.use('/', router);

export { app };
import express, { Request, Response } from 'express';
import { query, validationResult } from 'express-validator';

export const authRouter = express.Router();

authRouter.get('/authorize', [
  query('response_type').equals('code').withMessage('Only "code" response_type is supported'),
  query('client_id').isString().withMessage('Invalid client_id'),
  query('redirect_uri').isURL().withMessage('Invalid redirect_uri'),
  query('state').isString().withMessage('Invalid state'),
  query('scope').custom(value => {
    const allowedScopes = ['read', 'write', 'delete'];
    const requestedScopes = value.split(' ');
    return requestedScopes.every(scope => allowedScopes.includes(scope));
  }).withMessage('Invalid scope')
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { client_id, redirect_uri, state, scope } = req.query;
  // Simulate authorization logic here

  const code = 'sampleAuthorizationCode'; // This should be securely generated
  const redirectUrl = new URL(redirect_uri as string);
  redirectUrl.searchParams.append('code', code);
  redirectUrl.searchParams.append('state', state as string);

  res.redirect(redirectUrl.toString());
});
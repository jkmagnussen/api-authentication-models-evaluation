import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { check, validationResult } from 'express-validator';

const authRouter = express.Router();

const validRedirectUris = ['https://client-app.com/callback'];
const validScopes = ['read', 'write', 'admin'];

authRouter.get('/authorize', [
  check('client_id').notEmpty().withMessage('client_id is required'),
  check('redirect_uri').isURL().withMessage('Invalid redirect_uri format'),
  check('response_type').equals('code').withMessage('Only authorization code flow is supported'),
  check('scope').custom((scopes) => {
    const requestedScopes = scopes.split(' ');
    return requestedScopes.every(scope => validScopes.includes(scope));
  }).withMessage('One or more scopes are invalid'),
  check('state').optional().isString().withMessage('Invalid state format')
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { redirect_uri, state = '', scope } = req.query;

  if (!validRedirectUris.includes(redirect_uri as string)) {
    return res.status(400).send('Invalid redirect_uri');
  }

  const authorizationCode = crypto.randomBytes(20).toString('hex');
  
  const redirectUrl = new URL(redirect_uri as string);
  redirectUrl.searchParams.append('code', authorizationCode);
  if (state) {
    redirectUrl.searchParams.append('state', state as string);
  }

  res.redirect(redirectUrl.toString());
});

export { authRouter };
import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';

const authRouter = express.Router();

const validRedirectUris = ['https://trusted-client.com/callback'];
const validScopes = ['read', 'write', 'admin'];

authRouter.post(
  '/authorize',
  [
    body('response_type').equals('code').withMessage('Invalid response type'),
    body('client_id').isString().withMessage('Client ID must be a string'),
    body('redirect_uri').isURL().withMessage('Invalid redirect URI'),
    body('scope').isString().withMessage('Scope must be a string'),
    body('state').optional().isString().withMessage('State must be a string')
  ],
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { redirect_uri, scope, state } = req.body;

    if (!validRedirectUris.includes(redirect_uri)) {
      return res.status(400).json({ error: 'Invalid redirect URI' });
    }

    const requestedScopes = scope.split(' ');
    const invalidScopes = requestedScopes.filter(s => !validScopes.includes(s));
    if (invalidScopes.length > 0) {
      return res.status(400).json({ error: 'Invalid scopes requested', invalidScopes });
    }

    const code = crypto.randomBytes(20).toString('hex');
    const queryParams = new URLSearchParams({ code, state }).toString();
    const redirectUrl = `${redirect_uri}?${queryParams}`;

    return res.redirect(302, redirectUrl);
  }
);

export { authRouter };
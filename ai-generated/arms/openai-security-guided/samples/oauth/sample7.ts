import express, { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';

const authRouter = express.Router();

export const authorizationHandler = [
  check('redirect_uri').isURL().withMessage('Invalid redirect URI.').custom((value) => {
    const allowedUris = ['https://example.com/callback', 'https://anotherdomain.com/callback'];
    return allowedUris.includes(value);
  }).withMessage('Redirect URI not allowed.'),
  check('client_id').notEmpty().withMessage('Client ID is required.'),
  check('response_type').equals('code').withMessage('Invalid response type.'),
  check('scope').notEmpty().withMessage('Scope is required.').custom((value) => {
    const acceptedScopes = ['read', 'write', 'admin'];
    const scopes = value.split(' ');
    return scopes.every(scope => acceptedScopes.includes(scope));
  }).withMessage('Invalid scope.'),
  check('state').notEmpty().withMessage('State parameter is required.'),
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { redirect_uri, state } = req.query;
    const authorizationCode = 'sampleAuthCode123';

    res.redirect(`${redirect_uri}?code=${authorizationCode}&state=${state}`);
  }
];

authRouter.get('/authorize', authorizationHandler);

export { authRouter };
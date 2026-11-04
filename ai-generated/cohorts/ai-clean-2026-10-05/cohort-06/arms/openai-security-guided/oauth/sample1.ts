import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

const router = express.Router();

interface AuthRequest extends Request {
  body: {
    response_type: string;
    client_id: string;
    redirect_uri: string;
    scope: string;
    state?: string;
  };
}

const validateAuthRequest = [
  body('response_type').equals('code').withMessage('Invalid response type'),
  body('client_id').isString().withMessage('Client ID must be a string'),
  body('redirect_uri').isURL().withMessage('Invalid redirect URI'),
  body('scope').isString().withMessage('Scope must be a string'),
];

const handleErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const authorizationEndpoint = (req: AuthRequest, res: Response) => {
  const { client_id, redirect_uri, scope, state } = req.body;

  // Simulate client validation for demonstration purposes
  const isValidClient = client_id === 'trustedClient';
  if (!isValidClient) {
    return res.status(403).send('Unauthorized client');
  }

  // Simulated user consent - in real implementation, render a form to get user consent
  const userHasConsented = true;
  if (!userHasConsented) {
    return res.status(403).send('User did not consent');
  }

  // Generate authorization code (mocked for demonstration)
  const authorizationCode = 'sampleAuthCode123';

  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.append('code', authorizationCode);
  if (state) {
    redirectUrl.searchParams.append('state', state);
  }

  res.redirect(redirectUrl.toString());
};

router.post('/oauth/authorize', validateAuthRequest, handleErrors, authorizationEndpoint);

export { router as authRouter };
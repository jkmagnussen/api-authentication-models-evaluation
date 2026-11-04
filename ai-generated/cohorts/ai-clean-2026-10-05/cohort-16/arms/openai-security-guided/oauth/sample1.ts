import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';

const app = express();
app.use(express.json());

interface Client {
  clientId: string;
  redirectUri: string;
}

const clients: Client[] = [
  { clientId: 'abc123', redirectUri: 'https://example.com/callback' }
];

const generateAuthCode = (): string => {
  return crypto.randomBytes(20).toString('hex');
};

const validateOauthRequest = [
  body('response_type').equals('code').withMessage('Invalid response type'),
  body('client_id').isString().withMessage('Client ID must be a string'),
  body('redirect_uri').isURL().withMessage('Invalid redirect URI'),
];

const authorizationEndpoint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { client_id, redirect_uri } = req.body;
    const client = clients.find(client => client.clientId === client_id && client.redirectUri === redirect_uri);

    if (!client) {
      return res.status(401).send('Unauthorized');
    }

    const authCode = generateAuthCode();
    // Store authCode securely with association to client_id for later token exchange (omitted for brevity)

    res.redirect(`${redirect_uri}?code=${authCode}`);
  } catch (error) {
    next(error);
  }
};

app.post('/oauth/authorize', validateOauthRequest, authorizationEndpoint);

export { app, authorizationEndpoint };
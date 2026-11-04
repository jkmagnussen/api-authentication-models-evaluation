import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';

const app = express();
app.use(express.json());

const validateInput = [
  body('client_id').isString().notEmpty(),
  body('redirect_uri').isURL(),
  body('response_type').equals('code'),
  body('scope').isString().optional(),
  body('state').isString().optional()
];

const isValidClient = (clientId: string, redirectUri: string): boolean => {
  // Placeholder for client validation logic
  return clientId === 'valid_client_id' && redirectUri === 'https://valid.redirect.uri';
};

const generateAuthCode = (): string => {
  // Generate a secure random authorization code
  return Math.random().toString(36).substring(2, 15);
};

const authorizationEndpoint = (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid request parameters' });
  }

  const { client_id, redirect_uri, state } = req.body;

  if (!isValidClient(client_id, redirect_uri)) {
    return res.status(400).json({ error: 'Invalid client credentials' });
  }

  const authCode = generateAuthCode();
  let redirectUrl = `${redirect_uri}?code=${authCode}`;
  
  if (state) {
    redirectUrl += `&state=${state}`;
  }

  res.redirect(302, redirectUrl);
};

app.post('/oauth2/authorize', validateInput, authorizationEndpoint);

export { app };
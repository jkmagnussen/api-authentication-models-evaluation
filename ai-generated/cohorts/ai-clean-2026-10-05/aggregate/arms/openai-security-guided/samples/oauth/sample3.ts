import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';

const app = express();
app.use(express.json());

interface Client {
  clientId: string;
  redirectUris: string[];
  secret: string;
}

const clients: Client[] = [
  { clientId: 'abc123', redirectUris: ['https://example.com/callback'], secret: 'secret123' }
];

const generateAuthCode = (): string => {
  return crypto.randomBytes(16).toString('hex');
};

export const authorizationEndpoint = app.post('/oauth/authorize', [
  body('response_type').equals('code').withMessage('Invalid response type'),
  body('client_id').isString().withMessage('Invalid client ID'),
  body('redirect_uri').isURL().withMessage('Invalid redirect URI'),
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { response_type, client_id, redirect_uri } = req.body;
  const client = clients.find(c => c.clientId === client_id);

  if (!client) {
    return res.status(400).json({ error: 'Invalid client_id' });
  }

  if (!client.redirectUris.includes(redirect_uri)) {
    return res.status(400).json({ error: 'Invalid redirect_uri' });
  }

  const authCode = generateAuthCode();
  // Here you would normally save the auth code with related client info in a database
  
  const redirectTo = new URL(redirect_uri);
  redirectTo.searchParams.append('code', authCode);

  res.redirect(redirectTo.toString());
});

export default app;
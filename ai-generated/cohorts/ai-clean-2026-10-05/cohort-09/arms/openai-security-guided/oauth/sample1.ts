import express, { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import crypto from 'crypto';

const app = express();
app.use(express.json());

interface Client {
  clientId: string;
  redirectUri: string;
}

const clients: Client[] = [
  { clientId: 'abc123', redirectUri: 'https://client.example.com/callback' }
];

const validateClient = (clientId: string, redirectUri: string): boolean => {
  const client = clients.find(c => c.clientId === clientId && c.redirectUri === redirectUri);
  return !!client;
};

app.get('/oauth/authorize', [
  check('response_type').equals('code').withMessage('Invalid response type'),
  check('client_id').isString().withMessage('Client ID is required'),
  check('redirect_uri').isURL().withMessage('Valid redirect URI is required')
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { client_id, redirect_uri } = req.query;

  if (!validateClient(client_id as string, redirect_uri as string)) {
    return res.status(400).send('Invalid client or redirect URI');
  }

  const code = crypto.randomBytes(20).toString('hex');
  const redirectUrl = new URL(redirect_uri as string);
  redirectUrl.searchParams.set('code', code);

  res.redirect(redirectUrl.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Authorization server running on port ${PORT}`);
});

export { app };
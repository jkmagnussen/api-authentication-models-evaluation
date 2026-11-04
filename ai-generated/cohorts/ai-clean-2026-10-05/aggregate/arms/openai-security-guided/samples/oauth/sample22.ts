import express, { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import crypto from 'crypto';

export const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const VALID_CLIENT_IDS = ['client123', 'client456'];
const REDIRECT_URIS: { [key: string]: string } = {
  'client123': 'https://client123.com/callback',
  'client456': 'https://client456.com/callback'
};

app.get('/oauth/authorize', [
  check('response_type').equals('code').withMessage('Invalid response type'),
  check('client_id').isIn(VALID_CLIENT_IDS).withMessage('Invalid client ID'),
  check('redirect_uri').isURL().withMessage('Invalid redirect URI')
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid request', details: errors.array() });
  }

  const { response_type, client_id, redirect_uri, state } = req.query;

  if (REDIRECT_URIS[client_id as string] !== redirect_uri) {
    return res.status(400).json({ error: 'Mismatched redirect URI' });
  }

  const authorizationCode = crypto.randomBytes(20).toString('hex');

  const redirectUrl = new URL(redirect_uri as string);
  redirectUrl.searchParams.append('code', authorizationCode);
  if (state) {
    redirectUrl.searchParams.append('state', state as string);
  }

  res.redirect(redirectUrl.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Authorization server listening on port ${PORT}`);
});
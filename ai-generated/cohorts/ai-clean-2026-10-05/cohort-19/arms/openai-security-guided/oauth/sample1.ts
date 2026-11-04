import express, { Request, Response } from 'express';
import { query, validationResult } from 'express-validator';

const app = express();

const validClients = new Set(['client1', 'client2']);
const validRedirectUris = new Map([
  ['client1', 'https://client1.com/auth/callback'],
  ['client2', 'https://client2.com/auth/callback']
]);

app.get('/authorize',
  [
    query('response_type').equals('code'),
    query('client_id').isIn(Array.from(validClients)),
    query('redirect_uri').custom((value, { req }) => {
      const clientId = req.query.client_id as string;
      return validRedirectUris.get(clientId) === value;
    }),
    query('state').notEmpty()
  ],
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const clientId = req.query.client_id as string;
    const redirectUri = req.query.redirect_uri as string;
    const state = req.query.state as string;
    const code = generateAuthCode(clientId);

    res.redirect(`${redirectUri}?code=${code}&state=${state}`);
  }
);

function generateAuthCode(clientId: string): string {
  // In a real application, create a more secure, unique auth code
  return `authCodeFor-${clientId}-${Math.random().toString(36).substring(2, 15)}`;
}

export { app };
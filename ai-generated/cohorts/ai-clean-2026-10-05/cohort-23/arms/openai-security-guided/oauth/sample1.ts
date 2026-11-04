import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';

const app = express();
app.use(express.json());

const validClients = new Map<string, string>(); // client_id -> redirect_uri
const validRedirectUris = new Set<string>(); // pre-registered URIs

// Initialize with some secure values
validClients.set('client123', 'https://clientapp.com/callback');
validRedirectUris.add('https://clientapp.com/callback');

// Middleware to validate authorization request
const validateAuthRequest = [
  body('response_type').equals('code'),
  body('client_id').isString(),
  body('redirect_uri').isURL()
];

// OAuth 2.0 Authorization Endpoint
app.post('/authorize', validateAuthRequest, (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'invalid_request', details: errors.array() });
  }

  const { response_type, client_id, redirect_uri, scope, state } = req.body;
  if (!validClients.has(client_id) || validClients.get(client_id) !== redirect_uri) {
    return res.status(400).json({ error: 'unauthorized_client' });
  }

  const code = crypto.randomBytes(20).toString('hex'); // Generate authorization code
  const url = new URL(redirect_uri);
  url.searchParams.set('code', code);
  if (state) url.searchParams.set('state', state);

  return res.status(302).redirect(url.toString());
});

export { app };
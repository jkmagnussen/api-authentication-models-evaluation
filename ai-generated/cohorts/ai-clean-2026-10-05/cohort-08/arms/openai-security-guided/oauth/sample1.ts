import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';

// Dummy database and constants for illustration
const clients = new Map<string, { clientSecret: string, redirectUris: string[] }>();
const validResponseTypes = ['code'];

const app = express();
app.use(express.urlencoded({ extended: true }));

app.post('/oauth2/authorize', 
  body('response_type').isIn(validResponseTypes),
  body('client_id').isString().notEmpty(),
  body('redirect_uri').isURL(),
  (req: Request, res: Response) => {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { response_type, client_id, redirect_uri, state } = req.body;

    // Check if client_id exists
    const client = clients.get(client_id);
    if (!client) {
      return res.status(400).json({ error: 'Invalid client_id' });
    }

    // Redirect URI validation
    if (!client.redirectUris.includes(redirect_uri)) {
      return res.status(400).json({ error: 'Invalid redirect_uri' });
    }

    // Generate authorization code
    const authorizationCode = crypto.randomBytes(20).toString('hex');

    // Here you would store the authorization code with an association to the user and client

    // Redirect with code and state
    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.append('code', authorizationCode);
    if (state) {
      redirectUrl.searchParams.append('state', state);
    }

    return res.redirect(302, redirectUrl.toString());
  }
);

export { app };
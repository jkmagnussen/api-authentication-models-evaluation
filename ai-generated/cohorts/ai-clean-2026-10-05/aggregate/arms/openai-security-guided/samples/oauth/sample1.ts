import express, { Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import crypto from 'crypto';

const router = express.Router();

// Simulate a database for clients and authorization codes
const clients = new Map<string, { redirectUri: string }>();
const authorizationCodes = new Map<string, string>();

// Register a dummy client for demonstration
clients.set('client123', { redirectUri: 'http://localhost/callback' });

router.get('/authorize',
  query('response_type').equals('code'),
  query('client_id').isString(),
  query('redirect_uri').isString(),
  query('state').optional().isString(),
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'invalid_request', details: errors.array() });
    }

    const { client_id, redirect_uri, state } = req.query;

    const client = clients.get(client_id as string);
    if (!client || client.redirectUri !== redirect_uri) {
      return res.status(400).json({ error: 'unauthorized_client' });
    }

    // Generate authorization code
    const code = crypto.randomBytes(16).toString('hex');
    authorizationCodes.set(code, client_id as string);

    const redirectUri = new URL(redirect_uri as string);
    redirectUri.searchParams.set('code', code);
    if (state) redirectUri.searchParams.set('state', state as string);

    res.redirect(redirectUri.toString());
  }
);

export { router as authRouter };
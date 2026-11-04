import express, { Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import crypto from 'crypto';

const app = express();

export const authEndpoint = [
  query('response_type').isIn(['code']),
  query('client_id').isString().isLength({ min: 1 }),
  query('redirect_uri').isURL(),
  query('scope').isString().optional(),
  query('state').isString().optional(),

  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { response_type, client_id, redirect_uri, scope, state } = req.query;

    // Validate client_id against registered clients
    if (!isValidClientId(client_id as string)) {
      return res.status(400).json({ error: 'invalid_client' });
    }

    // Generate authorization code
    const authorizationCode = crypto.randomBytes(20).toString('hex');
    
    // Redirect user-agent
    let redirectUrl = `${redirect_uri}?code=${authorizationCode}`;
    if (state) {
      redirectUrl += `&state=${state}`;
    }

    res.redirect(302, redirectUrl);
  }
];

function isValidClientId(clientId: string): boolean {
  const registeredClients = ['client123', 'client456'];
  return registeredClients.includes(clientId);
}

app.get('/authorize', authEndpoint);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Authorization server running on port ${PORT}`);
});
import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Mock database for clients and authorization codes
const clients = new Map<string, { redirectUri: string }>();
const authCodes = new Map<string, { clientId: string; redirectUri: string }>();

// Register a sample client (in a real app, this would be in a database)
clients.set('client123', {
  redirectUri: 'https://client.example.com/callback',
});

// Function to generate a random string for code
function generateRandomString(length: number) {
  return crypto.randomBytes(length).toString('hex');
}

export const authorizationEndpoint = [
  body('response_type').equals('code'), // Ensure response_type is 'code'
  body('client_id').isString(), // Validate client_id as a string
  body('redirect_uri').isURL(), // Validate redirect_uri as a URL
  (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid request', details: errors.array() });
    }
    
    const { client_id, redirect_uri } = req.body;

    const client = clients.get(client_id);
    if (!client || client.redirectUri !== redirect_uri) {
      return res.status(400).json({ error: 'Invalid client_id or redirect_uri' });
    }
    
    const code = generateRandomString(16);
    authCodes.set(code, { clientId: client_id, redirectUri: redirect_uri });
    
    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.append('code', code);

    // Redirect the user-agent to the client's redirect URI with the generated code
    res.redirect(302, redirectUrl.toString());
  }
];

app.post('/authorize', authorizationEndpoint);

export default app;
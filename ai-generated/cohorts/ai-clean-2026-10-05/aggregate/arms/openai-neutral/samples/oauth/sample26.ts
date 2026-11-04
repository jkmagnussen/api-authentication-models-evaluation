import express, { Request, Response } from 'express';

const router = express.Router();

// Sample client data for demonstration purposes
const clients = [
  {
    clientId: 'client123',
    redirectUri: 'http://localhost:3000/callback',
    clientSecret: 'secret123'
  }
];

// Sample user data for demonstration purposes
const users = [
  {
    username: 'user1',
    password: 'password1',
    userId: 'user123'
  }
];

// In-memory store for authorization codes
const authorizationCodes: { [code: string]: { clientId: string, userId: string } } = {};

function generateAuthCode(): string {
  return Math.random().toString(36).substring(2, 12);
}

router.get('/authorize', (req: Request, res: Response) => {
  const { response_type, client_id, redirect_uri, state } = req.query;

  if (!response_type || response_type !== 'code') {
    return res.status(400).send('Invalid response_type');
  }

  const client = clients.find(client => client.clientId === client_id);
  if (!client || client.redirectUri !== redirect_uri) {
    return res.status(400).send('Invalid client_id or redirect_uri');
  }

  // Simulate user login
  const user = users[0]; // Assume user is logged in

  const authorizationCode = generateAuthCode();
  authorizationCodes[authorizationCode] = { clientId: client.clientId, userId: user.userId };

  const redirectUrl = new URL(redirect_uri as string);
  redirectUrl.searchParams.append('code', authorizationCode);
  if (state) {
    redirectUrl.searchParams.append('state', state as string);
  }

  res.redirect(redirectUrl.toString());
});

export { router as authRouter };
import express, { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import querystring from 'querystring';

const app = express();
const port = 3000;

// Mock user storage
const users = [
  { username: 'user1', password: 'pass1' },
  { username: 'user2', password: 'pass2' }
];

// Mock client storage
const clients = [
  { clientId: 'client1', clientSecret: 'secret1', redirectUri: 'http://localhost/callback' }
];

// In-memory store to keep authorization codes
const authorizationCodes = new Map<string, { clientId: string, username: string }>();

app.use(express.urlencoded({ extended: true }));

// Authorization endpoint
app.get('/authorize', (req: Request, res: Response) => {
  const { response_type, client_id, redirect_uri, state } = req.query;

  if (response_type !== 'code') {
    return res.status(400).send('Invalid response type');
  }

  const client = clients.find(c => c.clientId === client_id && c.redirectUri === redirect_uri);
  if (!client) {
    return res.status(400).send('Invalid client');
  }

  res.send(`
    <form method="POST" action="/authorize">
      <input type="hidden" name="client_id" value="${client_id}" />
      <input type="hidden" name="redirect_uri" value="${redirect_uri}" />
      <input type="hidden" name="state" value="${state || ''}" />
      <div>
        <label>Username:</label>
        <input type="text" name="username" />
      </div>
      <div>
        <label>Password:</label>
        <input type="password" name="password" />
      </div>
      <button type="submit">Authorize</button>
    </form>
  `);
});

app.post('/authorize', (req: Request, res: Response) => {
  const { client_id, redirect_uri, username, password, state } = req.body;
  
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).send('Invalid credentials');
  }

  const client = clients.find(c => c.clientId === client_id && c.redirectUri === redirect_uri);
  if (!client) {
    return res.status(400).send('Invalid client');
  }

  const code = randomBytes(16).toString('hex');
  authorizationCodes.set(code, { clientId: client_id, username });

  const redirectUrl = `${redirect_uri}?${querystring.stringify({ code, state })}`;
  res.redirect(redirectUrl);
});

app.listen(port, () => {
  console.log(`OAuth 2.0 Authorization Server listening at http://localhost:${port}`);
});

export { app };
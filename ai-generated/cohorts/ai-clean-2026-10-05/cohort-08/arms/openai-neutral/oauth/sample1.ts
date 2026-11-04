import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

interface AuthorizationRequest {
  response_type: string;
  client_id: string;
  redirect_uri: string;
  scope: string;
  state?: string;
}

const clients = new Map<string, { redirectUri: string }>();
clients.set('client_id_example', { redirectUri: 'http://localhost:3000/callback' });

export const authorizationEndpoint = (req: Request, res: Response) => {
  const { response_type, client_id, redirect_uri, scope, state }: AuthorizationRequest = req.query;

  if (!response_type || !client_id || !redirect_uri || !scope) {
    return res.status(400).send('Missing required query parameters.');
  }

  if (response_type !== 'code') {
    return res.status(400).send('Unsupported response_type.');
  }

  const client = clients.get(client_id);
  if (!client) {
    return res.status(400).send('Invalid client_id.');
  }

  if (client.redirectUri !== redirect_uri) {
    return res.status(400).send('Invalid redirect_uri.');
  }

  const authorizationCode = uuidv4();
  // In a real implementation, you would save the authorizationCode and client_id association to a database

  const queryParams = new URLSearchParams({ code: authorizationCode });
  if (state) {
    queryParams.append('state', state);
  }

  res.redirect(`${redirect_uri}?${queryParams.toString()}`);
};

app.get('/authorize', authorizationEndpoint);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`OAuth 2.0 Authorization Server running on port ${PORT}`);
});
import express, { Request, Response } from 'express';
import { generateAccessToken, validateClient, generateAuthCode } from './authUtils';

const app = express();
const port = 3000;

app.use(express.json());

export const authorizationEndpoint = async (req: Request, res: Response) => {
  const { response_type, client_id, redirect_uri, scope, state } = req.query;

  if (!response_type || !client_id || !redirect_uri) {
    return res.status(400).json({ error: 'invalid_request' });
  }
  
  if (response_type !== 'code') {
    return res.status(400).json({ error: 'unsupported_response_type' });
  }

  const client = await validateClient(client_id as string, redirect_uri as string);
  if (!client) {
    return res.status(401).json({ error: 'unauthorized_client' });
  }

  const authorizationCode = generateAuthCode(client_id as string, scope as string);

  const redirectUrl = new URL(redirect_uri as string);
  redirectUrl.searchParams.append('code', authorizationCode);
  if (state) {
    redirectUrl.searchParams.append('state', state as string);
  }

  res.redirect(redirectUrl.toString());
};

app.get('/authorize', authorizationEndpoint);

app.listen(port, () => {
  console.log(`Authorization server running at http://localhost:${port}`);
});
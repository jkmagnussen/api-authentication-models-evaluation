import express, { Request, Response } from 'express';
import { generateAuthCode, generateAccessToken, validateClient } from './oauthUtils';

const app = express();
app.use(express.json());

export const authorizationEndpoint = async (req: Request, res: Response) => {
  const { response_type, client_id, redirect_uri, scope, state } = req.query;

  if (!response_type || response_type !== 'code') {
    return res.status(400).json({ error: 'unsupported_response_type' });
  }

  if (!client_id || !validateClient(client_id as string, redirect_uri as string)) {
    return res.status(400).json({ error: 'invalid_client' });
  }

  const authorizationCode = generateAuthCode(client_id as string, redirect_uri as string, scope as string);

  const redirectUrl = new URL(redirect_uri as string);
  redirectUrl.searchParams.append('code', authorizationCode);
  if (state) {
    redirectUrl.searchParams.append('state', state as string);
  }

  res.redirect(redirectUrl.toString());
};

app.get('/authorize', authorizationEndpoint);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`OAuth 2.0 Authorization Server running on port ${PORT}`);
});

// oauthUtils.ts
export function validateClient(clientId: string, redirectUri: string): boolean {
  // Dummy validation for example purposes
  return clientId === 'valid-client-id' && redirectUri.startsWith('http://localhost');
}

export function generateAuthCode(clientId: string, redirectUri: string, scope: string): string {
  // Dummy code generation for example purposes
  return 'auth-code-sample';
}

export function generateAccessToken(authCode: string): string {
  // Dummy access token generation
  return 'access-token-sample';
}
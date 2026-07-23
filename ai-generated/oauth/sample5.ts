```typescript
import express, { Request, Response } from 'express';
import crypto from 'crypto';

const app = express();
app.use(express.urlencoded({ extended: true }));

interface AuthorizationRequest {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  state: string;
}

interface RegisteredClient {
  id: string;
  secret: string;
  redirectUris: string[];
  allowedScopes: string[];
}

const registeredClients: Map<string, RegisteredClient> = new Map([
  [
    'app_mobile_client',
    {
      id: 'app_mobile_client',
      secret: 'secret_mobile_key_12345',
      redirectUris: ['https://app.example.com/oauth/callback'],
      allowedScopes: ['profile', 'email', 'openid'],
    },
  ],
]);

const authorizationGrants: Map<
  string,
  {
    code: string;
    clientId: string;
    userId: string;
    redirectUri: string;
    scopes: string[];
    expiresAt: number;
  }
> = new Map();

export function validateClientRegistration(clientId: string): RegisteredClient | null {
  return registeredClients.get(clientId) || null;
}

export function issueAuthorizationCode(
  clientId: string,
  userId: string,
  redirectUri: string,
  scopes: string[]
): string {
  const authCode = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  authorizationGrants.set(authCode, {
    code: authCode,
    clientId,
    userId,
    redirectUri,
    scopes,
    expiresAt,
  });

  return authCode;
}

export function parseAuthorizationRequest(query: Record<string, any>): AuthorizationRequest | null {
  const { client_id, redirect_uri, response_type, scope, state } = query;

  if (!client_id || !redirect_uri || !response_type || !state) {
    return null;
  }

  if (response_type !== 'code') {
    return null;
  }

  return {
    client_id,
    redirect_uri,
    response_type,
    scope: scope || '',
    state,
  };
}

export function getAuthorizationEndpoint() {
  return (req: Request, res: Response) => {
    const authReq = parseAuthorizationRequest(req.query);

    if (!authReq) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing or invalid parameters',
      });
    }

    const client = validateClientRegistration(authReq.client_id);
    if (!client) {
      return res.status(400).json({
        error: 'invalid_client',
        error_description: 'Client not registered',
      });
    }

    const parsedRedirectUri = new URL(authReq.redirect_uri);
    const clientRedirectUri = new URL(client.redirectUris[0]);

    if (
      parsedRedirectUri.protocol !== clientRedirectUri.protocol ||
      parsedRedirectUri.hostname !== clientRedirectUri.hostname ||
      parsedRedirectUri.port !== clientRedirectUri.port
    ) {
      return res.status(400).json({
        error: 'invalid_redirect_uri',
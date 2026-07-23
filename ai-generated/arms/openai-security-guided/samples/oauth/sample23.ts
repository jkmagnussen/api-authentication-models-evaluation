```typescript
import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { URL } from 'url';

const app = express();
const port = 3000;

interface AuthorizationRequest {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  state: string;
  nonce?: string;
}

interface ClientConfig {
  clientId: string;
  allowedRedirectUris: string[];
  allowedScopes: string[];
}

const registeredClients: Map<string, ClientConfig> = new Map([
  [
    'client_app_123',
    {
      clientId: 'client_app_123',
      allowedRedirectUris: [
        'http://localhost:3001/callback',
        'https://trusted-app.example.com/auth/callback',
      ],
      allowedScopes: ['openid', 'profile', 'email', 'offline_access'],
    },
  ],
  [
    'another_client',
    {
      clientId: 'another_client',
      allowedRedirectUris: ['https://another-app.example.com/callback'],
      allowedScopes: ['openid', 'profile'],
    },
  ],
]);

const stateStore: Map<string, { timestamp: number; verified: boolean }> = new Map();
const STATE_EXPIRY_MS = 10 * 60 * 1000;

interface ValidationResult {
  isValid: boolean;
  error?: string;
  errorDescription?: string;
}

export const validateRedirectUri = (
  clientId: string,
  redirectUri: string
): ValidationResult => {
  const client = registeredClients.get(clientId);

  if (!client) {
    return {
      isValid: false,
      error: 'invalid_client',
      errorDescription: 'Client not registered',
    };
  }

  if (!redirectUri) {
    return {
      isValid: false,
      error: 'invalid_request',
      errorDescription: 'Redirect URI is required',
    };
  }

  try {
    const parsedUri = new URL(redirectUri);

    const isAllowed = client.allowedRedirectUris.some((allowed) => {
      try {
        const allowedUrl = new URL(allowed);
        return (
          parsedUri.protocol === allowedUrl.protocol &&
          parsedUri.hostname === allowedUrl.hostname &&
          parsedUri.port === allowedUrl.port &&
          parsedUri.pathname === allowedUrl.pathname
        );
      } catch {
        return false;
      }
    });

    if (!isAllowed) {
      return {
        isValid: false,
        error: 'invalid_request',
        errorDescription: 'Redirect URI mismatch',
      };
    }

    if (parsedUri.protocol !== 'https:' && parsedUri.hostname !== 'localhost') {
      return {
        isValid: false,
        error: 'invalid_request',
        errorDescription: 'Redirect URI must use HTTPS',
      };
    }

    return { isValid: true };
  } catch {
    return {
      isValid: false,
      error: 'invalid_request',
      errorDescription: 'Invalid redirect URI format',
    };
  }
};

export const validateScopes = (clientId: string, requestedScopes: string): ValidationResult => {
  const client = registeredClients.get(clientId);

  if (!client) {
    return {
      isValid: false,
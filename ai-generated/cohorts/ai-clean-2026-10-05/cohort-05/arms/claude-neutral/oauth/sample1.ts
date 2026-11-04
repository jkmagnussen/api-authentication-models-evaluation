```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";
import crypto from "crypto";

const app = express();
const client = new Anthropic();

interface AuthorizationRequest {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  state: string;
  code_challenge?: string;
  code_challenge_method?: string;
}

interface StoredAuthCode {
  code: string;
  client_id: string;
  redirect_uri: string;
  scope: string;
  created_at: number;
  expires_at: number;
  code_challenge?: string;
  code_challenge_method?: string;
}

// In-memory storage for authorization codes and tokens
const authorizationCodes: Map<string, StoredAuthCode> = new Map();
const accessTokens: Map<
  string,
  {
    token: string;
    client_id: string;
    scope: string;
    created_at: number;
    expires_at: number;
  }
> = new Map();

// Registered OAuth clients
const registeredClients: Map<string, { secret: string; name: string }> =
  new Map([
    [
      "test_client",
      {
        secret: "test_secret",
        name: "Test Client Application",
      },
    ],
  ]);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

export const validateClientId = (clientId: string): boolean => {
  return registeredClients.has(clientId);
};

export const validateRedirectUri = (
  clientId: string,
  redirectUri: string
): boolean => {
  // In production, store registered redirect URIs per client
  // For demo, allow localhost redirect URIs
  return (
    redirectUri.startsWith("http://localhost:") ||
    redirectUri.startsWith("https://")
  );
};

export const generateAuthorizationCode = (
  clientId: string,
  redirectUri: string,
  scope: string,
  codeChallengeMethod?: string,
  codeChallenge?: string
): string => {
  const code = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  authorizationCodes.set(code, {
    code,
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    created_at: Date.now(),
    expires_at: expiresAt,
    code_challenge_method: codeChallengeMethod,
    code_challenge: codeChallenge,
  });

  return code;
};

export const generateAccessToken = (
  clientId: string,
  scope: string
): string => {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

  accessTokens.set(token, {
    token,
    client_id: clientId,
    scope,
    created_at: Date.now(),
    expires_at: expiresAt,
  });

  return token;
};

export const verifyAuthorizationCode = (
  code: string,
  clientId: string,
  redirectUri: string,
  codeVerifier?: string
): boolean => {
  const storedCode = authorizationCodes.get(code);

  if (!storedCode) {
    return false;
  }
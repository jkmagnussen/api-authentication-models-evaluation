```typescript
import express, { Request, Response } from "express";
import crypto from "crypto";

const app = express();
app.use(express.urlencoded({ extended: true }));

interface ClientConfig {
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  scope: string[];
}

interface AuthorizationCode {
  code: string;
  clientId: string;
  userId: string;
  redirectUri: string;
  scope: string[];
  expiresAt: number;
  codeChallenge?: string;
}

interface AccessToken {
  token: string;
  clientId: string;
  userId: string;
  scope: string[];
  issuedAt: number;
  expiresAt: number;
}

const registeredClients: Map<string, ClientConfig> = new Map([
  [
    "client_app_001",
    {
      clientId: "client_app_001",
      clientSecret: "secret_key_2024_secure",
      redirectUris: ["http://localhost:3001/callback"],
      scope: ["read", "write", "profile"],
    },
  ],
]);

const authorizationCodes: Map<string, AuthorizationCode> = new Map();
const activeAccessTokens: Map<string, AccessToken> = new Map();

export const generateAuthCode = (clientId: string): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const generateAccessToken = (clientId: string): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const validateRedirectUri = (
  clientId: string,
  redirectUri: string
): boolean => {
  const client = registeredClients.get(clientId);
  if (!client) return false;
  return client.redirectUris.includes(redirectUri);
};

export const validateClientCredentials = (
  clientId: string,
  clientSecret: string
): boolean => {
  const client = registeredClients.get(clientId);
  if (!client) return false;
  return client.clientSecret === clientSecret;
};

export const authorizationEndpoint = (req: Request, res: Response): void => {
  const {
    client_id,
    redirect_uri,
    response_type,
    scope,
    state,
    code_challenge,
  } = req.query;

  if (!client_id || !redirect_uri || !response_type) {
    res
      .status(400)
      .json({ error: "invalid_request", error_description: "Missing params" });
    return;
  }

  if (!validateRedirectUri(client_id as string, redirect_uri as string)) {
    res.status(400).json({
      error: "invalid_request",
      error_description: "Invalid redirect URI",
    });
    return;
  }

  if (response_type !== "code") {
    const errorUrl = new URL(redirect_uri as string);
    errorUrl.searchParams.append("error", "unsupported_response_type");
    if (state) {
      errorUrl.searchParams.append("state", state as string);
    }
    res.redirect(errorUrl.toString());
    return;
  }

  const authCode = generateAuthCode(client_id as string);
  const codeRecord: AuthorizationCode = {
    code: authCode,
    clientId: client_id as string,
    userId: "user_123",
    redirectUri: redirect_uri as string,
    scope: ((scope as string) || "").split(" "),
    expiresAt: Date.now() + 10 * 60 *
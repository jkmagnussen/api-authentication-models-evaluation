```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";

const client = new Anthropic();
const app = express();

interface OAuthState {
  code: string;
  clientId: string;
  redirectUri: string;
  userId: string;
  expiresAt: number;
}

interface TokenRequest {
  code: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  grantType: string;
}

const authorizationCodes: Map<string, OAuthState> = new Map();
const registeredClients: Map<
  string,
  { secret: string; redirectUris: string[] }
> = new Map();

// Pre-register test clients
registeredClients.set("client123", {
  secret: "secret456",
  redirectUris: ["http://localhost:3001/callback"],
});

export const generateAuthorizationCode = (
  clientId: string,
  redirectUri: string,
  userId: string
): string => {
  const code = Math.random().toString(36).substring(7) + Date.now();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  authorizationCodes.set(code, {
    code,
    clientId,
    redirectUri,
    userId,
    expiresAt,
  });

  return code;
};

export const validateAuthorizationCode = (
  code: string,
  clientId: string,
  redirectUri: string
): boolean => {
  const state = authorizationCodes.get(code);

  if (!state) {
    return false;
  }

  if (state.expiresAt < Date.now()) {
    authorizationCodes.delete(code);
    return false;
  }

  if (state.clientId !== clientId || state.redirectUri !== redirectUri) {
    return false;
  }

  return true;
};

export const generateAccessToken = (userId: string): string => {
  const token =
    "access_" + Math.random().toString(36).substring(7) + Date.now();
  return token;
};

export const handleAuthorizationRequest = (
  req: Request,
  res: Response
): void => {
  const clientId = req.query.client_id as string;
  const redirectUri = req.query.redirect_uri as string;
  const responseType = req.query.response_type as string;
  const scope = req.query.scope as string;
  const state = req.query.state as string;

  if (!clientId || !redirectUri || !responseType) {
    res.status(400).json({ error: "missing_required_parameters" });
    return;
  }

  const client = registeredClients.get(clientId);
  if (!client) {
    res.status(401).json({ error: "invalid_client" });
    return;
  }

  if (!client.redirectUris.includes(redirectUri)) {
    res.status(401).json({ error: "invalid_redirect_uri" });
    return;
  }

  if (responseType !== "code") {
    res.status(400).json({ error: "unsupported_response_type" });
    return;
  }

  // Simulate user login and consent
  const userId = "user_" + Math.random().toString(36).substring(7);
  const authCode = generateAuthorizationCode(clientId, redirectUri, userId);

  const params = new URLSearchParams({
    code: authCode,
    state: state ||
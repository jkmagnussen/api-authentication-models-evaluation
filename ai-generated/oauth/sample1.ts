```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";
import crypto from "crypto";

interface AuthorizationSession {
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  timestamp: number;
}

interface OAuth2Client {
  id: string;
  secret: string;
  redirectUris: string[];
  allowedScopes: string[];
}

const app = express();
const client = new Anthropic();
app.use(express.json());

const authorizationSessions = new Map<string, AuthorizationSession>();
const registeredClients = new Map<string, OAuth2Client>();

function generateAuthCode(): string {
  return crypto.randomBytes(32).toString("hex");
}

function validateRedirectUri(clientId: string, redirectUri: string): boolean {
  const registeredClient = registeredClients.get(clientId);
  if (!registeredClient) return false;
  return registeredClient.redirectUris.includes(redirectUri);
}

function validateScopes(clientId: string, scopes: string): boolean {
  const registeredClient = registeredClients.get(clientId);
  if (!registeredClient) return false;
  const requestedScopes = scopes.split(" ");
  return requestedScopes.every((scope) =>
    registeredClient.allowedScopes.includes(scope)
  );
}

export const handleAuthorizationRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    client_id,
    redirect_uri,
    response_type,
    scope,
    state,
    code_challenge,
    code_challenge_method,
  } = req.query;

  if (!client_id || !redirect_uri || response_type !== "code") {
    res.status(400).json({
      error: "invalid_request",
      error_description: "Missing or invalid required parameters",
    });
    return;
  }

  if (!validateRedirectUri(client_id as string, redirect_uri as string)) {
    res.status(400).json({
      error: "invalid_client",
      error_description: "Redirect URI mismatch",
    });
    return;
  }

  if (scope && !validateScopes(client_id as string, scope as string)) {
    res.status(400).json({
      error: "invalid_scope",
      error_description: "Invalid scope requested",
    });
    return;
  }

  const authCode = generateAuthCode();
  const authSession: AuthorizationSession = {
    clientId: client_id as string,
    redirectUri: redirect_uri as string,
    scope: (scope as string) || "openid profile email",
    state: (state as string) || "",
    codeChallenge: code_challenge as string | undefined,
    codeChallengeMethod: code_challenge_method as string | undefined,
    timestamp: Date.now(),
  };

  authorizationSessions.set(authCode, authSession);

  const redirectUrl = new URL(redirect_uri as string);
  redirectUrl.searchParams.append("code", authCode);
  if (state) {
    redirectUrl.searchParams.append("state", state as string);
  }

  res.redirect(redirectUrl.toString());
};

export const handleTokenRequest = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { code, client_id, client_secret, grant_type, redirect_uri
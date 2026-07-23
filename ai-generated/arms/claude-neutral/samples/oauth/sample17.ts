```typescript
import express, { Router, Request, Response } from "express";
import crypto from "crypto";

const authRouter = Router();

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUris: Set<string>;
  allowedScopes: Set<string>;
  tokenExpiryMs: number;
}

interface AuthorizationRequest {
  clientId: string;
  redirectUri: string;
  scopes: string[];
  state: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}

const stateStore = new Map<string, AuthorizationRequest>();
const oauthConfig: OAuthConfig = {
  clientId: process.env.OAUTH_CLIENT_ID || "default-client",
  clientSecret: process.env.OAUTH_CLIENT_SECRET || "default-secret",
  redirectUris: new Set([
    "http://localhost:3001/callback",
    "https://app.example.com/oauth/callback",
  ]),
  allowedScopes: new Set(["read", "write", "profile", "email"]),
  tokenExpiryMs: 3600000,
};

function validateRedirectUri(uri: string): boolean {
  try {
    const parsed = new URL(uri);
    if (parsed.hash) return false;
    return oauthConfig.redirectUris.has(uri);
  } catch {
    return false;
  }
}

function validateScopes(scopes: string[]): boolean {
  if (!Array.isArray(scopes) || scopes.length === 0) return false;
  return scopes.every((scope) => oauthConfig.allowedScopes.has(scope));
}

function generateAuthorizationCode(): string {
  return crypto.randomBytes(32).toString("hex");
}

function generateStateToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

function validateCodeChallenge(
  challenge: string,
  method: string
): {
  valid: boolean;
  error?: string;
} {
  if (!challenge) {
    return { valid: true };
  }

  const validMethods = ["S256", "plain"];
  if (!validMethods.includes(method)) {
    return { valid: false, error: "Invalid code_challenge_method" };
  }

  if (method === "S256" && challenge.length !== 43) {
    return { valid: false, error: "Invalid S256 code_challenge length" };
  }

  if (method === "plain" && challenge.length > 128) {
    return { valid: false, error: "Invalid plain code_challenge length" };
  }

  return { valid: true };
}

export const authorizeEndpoint = (req: Request, res: Response): void => {
  const {
    client_id,
    redirect_uri,
    scope,
    state,
    response_type,
    code_challenge,
    code_challenge_method,
  } = req.query;

  const errors: string[] = [];

  if (!client_id || typeof client_id !== "string") {
    errors.push("Missing or invalid client_id");
  } else if (client_id !== oauthConfig.clientId) {
    errors.push("Invalid client_id");
  }

  if (!response_type || response_type !== "code") {
    errors.push("Invalid or missing response_type");
  }

  if (!redirect_uri || typeof redirect_uri !== "string") {
    errors.push("Missing redirect_uri");
  } else if (!validateRedirectUri(redirect_uri)) {
    errors.push("Invalid redirect_
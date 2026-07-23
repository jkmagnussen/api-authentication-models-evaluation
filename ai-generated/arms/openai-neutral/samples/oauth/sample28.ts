```typescript
import express, { Request, Response } from "express";
import crypto from "crypto";

const authRouter = express.Router();

// Validate configuration
const REQUIRED_CONFIG = {
  OAUTH_CLIENT_ID: process.env.OAUTH_CLIENT_ID,
  OAUTH_CLIENT_SECRET: process.env.OAUTH_CLIENT_SECRET,
  OAUTH_REDIRECT_DOMAIN: process.env.OAUTH_REDIRECT_DOMAIN || "localhost",
};

Object.entries(REQUIRED_CONFIG).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

const ALLOWED_SCOPES = new Set([
  "openid",
  "profile",
  "email",
  "offline_access",
]);
const STATE_VALIDITY_MS = 10 * 60 * 1000; // 10 minutes
const stateStore = new Map<
  string,
  { timestamp: number; codeChallenge?: string }
>();

interface AuthorizeRequest extends Request {
  query: {
    client_id?: string;
    redirect_uri?: string;
    response_type?: string;
    scope?: string;
    state?: string;
    code_challenge?: string;
    code_challenge_method?: string;
  };
}

function validateClientId(clientId: string | undefined): boolean {
  return clientId === REQUIRED_CONFIG.OAUTH_CLIENT_ID;
}

function validateResponseType(type: string | undefined): boolean {
  return type === "code";
}

function parseScopes(scopeString: string | undefined): string[] {
  if (!scopeString) return [];
  return scopeString.split(" ").filter((scope) => scope.length > 0);
}

function validateScopes(requestedScopes: string[]): boolean {
  if (requestedScopes.length === 0) return false;
  return requestedScopes.every((scope) => ALLOWED_SCOPES.has(scope));
}

function validateRedirectUri(redirectUri: string | undefined): boolean {
  if (!redirectUri) return false;

  try {
    const url = new URL(redirectUri);

    // Allow localhost for development
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      return url.protocol === "http:" || url.protocol === "https:";
    }

    // For production, validate against allowed domain
    return (
      (url.protocol === "https:" &&
        url.hostname === REQUIRED_CONFIG.OAUTH_REDIRECT_DOMAIN) ||
      url.hostname.endsWith("." + REQUIRED_CONFIG.OAUTH_REDIRECT_DOMAIN)
    );
  } catch {
    return false;
  }
}

function generateState(): string {
  return crypto.randomBytes(32).toString("hex");
}

function validateStateParameter(state: string | undefined): boolean {
  if (!state) return false;
  const entry = stateStore.get(state);
  if (!entry) return false;

  const age = Date.now() - entry.timestamp;
  if (age > STATE_VALIDITY_MS) {
    stateStore.delete(state);
    return false;
  }

  return true;
}

function storeState(state: string, codeChallenge?: string): void {
  stateStore.set(state, {
    timestamp: Date.now(),
    codeChallenge,
  });
}

function cleanupExpiredStates(): void {
  const now = Date.now();
  for (const [state, entry] of stateStore.entries()) {
    if (now - entry.
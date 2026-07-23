```typescript
import express, { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { URL } from "url";

interface AuthorizationRequest {
  clientId: string;
  redirectUri: string;
  responseType: string;
  scope: string[];
  state: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}

interface StoredAuthState {
  clientId: string;
  redirectUri: string;
  scope: string[];
  timestamp: number;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}

const VALID_SCOPES = new Set([
  "openid",
  "profile",
  "email",
  "offline_access",
  "api",
]);
const STATE_EXPIRY_MS = 600000; // 10 minutes
const ALLOWED_RESPONSE_TYPES = new Set(["code", "token"]);
const ALLOWED_CODE_CHALLENGE_METHODS = new Set(["S256", "plain"]);

const registeredClients = new Map<
  string,
  { redirectUris: string[]; secret: string }
>([
  [
    "client_123",
    {
      redirectUris: ["https://app.example.com/callback"],
      secret: "super_secret_key_123",
    },
  ],
  [
    "client_456",
    {
      redirectUris: ["http://localhost:3001/auth/callback"],
      secret: "another_secret_key_456",
    },
  ],
]);

const authStateStore = new Map<string, StoredAuthState>();
const authorizationCodes = new Map<
  string,
  { clientId: string; redirectUri: string; scope: string[]; expiresAt: number }
>();

function generateSecureState(): string {
  return crypto.randomBytes(32).toString("hex");
}

function generateAuthorizationCode(): string {
  return crypto.randomBytes(32).toString("hex");
}

function validateRedirectUri(
  clientId: string,
  redirectUri: string
): boolean {
  const client = registeredClients.get(clientId);
  if (!client) {
    return false;
  }

  try {
    const requestedUrl = new URL(redirectUri);
    const isHttps = requestedUrl.protocol === "https:";
    const isLocalhost = requestedUrl.hostname === "localhost";

    if (!isHttps && !isLocalhost) {
      return false;
    }

    return client.redirectUris.some(
      (uri) =>
        uri === redirectUri || uri.startsWith(requestedUrl.origin + "/")
    );
  } catch {
    return false;
  }
}

function validateScopes(requestedScopes: string[]): boolean {
  if (!Array.isArray(requestedScopes) || requestedScopes.length === 0) {
    return false;
  }

  if (requestedScopes.length > 10) {
    return false;
  }

  return requestedScopes.every((scope) => VALID_SCOPES.has(scope));
}

function validateState(state: string): boolean {
  if (!state || typeof state !== "string" || state.length < 32) {
    return false;
  }

  if (!/^[a-zA-Z0-9]+$/.test(state)) {
    return false;
  }

  return true;
}

function validateCodeChallenge(
  codeChallenge: string | undefined,
  method: string | undefined
): boolean {
  if (!codeChall
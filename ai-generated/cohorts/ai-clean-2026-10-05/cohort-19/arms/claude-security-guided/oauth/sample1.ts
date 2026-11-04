```typescript
import express, { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import url from "url";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Secure in-memory storage for authorization codes and tokens
// In production, use a secure database with encryption
const authorizationCodes = new Map<
  string,
  {
    clientId: string;
    redirectUri: string;
    scope: string;
    expiresAt: number;
    codeChallenge?: string;
    codeChallengeMethod?: string;
  }
>();

const refreshTokens = new Map<
  string,
  {
    clientId: string;
    scope: string;
    expiresAt: number;
  }
>();

// Registered clients - in production, retrieve from secure database
const registeredClients = new Map<
  string,
  {
    clientSecret: string;
    redirectUris: string[];
    allowedScopes: string[];
  }
>();

// Initialize with sample client
registeredClients.set("sample-client-id", {
  clientSecret: crypto.randomBytes(32).toString("hex"),
  redirectUris: ["http://localhost:3001/callback"],
  allowedScopes: ["openid", "profile", "email"],
});

// Constants for security
const AUTHORIZATION_CODE_EXPIRY = 10 * 60 * 1000; // 10 minutes
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
const ACCESS_TOKEN_EXPIRY = 3600; // 1 hour in seconds
const MAX_CODE_LENGTH = 128;
const MAX_SCOPE_LENGTH = 500;
const MAX_STATE_LENGTH = 500;
const MAX_NONCE_LENGTH = 500;

// Utility functions
function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

function validateClientId(clientId: unknown): clientId is string {
  if (typeof clientId !== "string") return false;
  if (clientId.length === 0 || clientId.length > 255) return false;
  return /^[a-zA-Z0-9\-_.~]+$/.test(clientId);
}

function validateRedirectUri(
  redirectUri: unknown,
  allowedUris: string[]
): boolean {
  if (typeof redirectUri !== "string") return false;
  if (redirectUri.length === 0 || redirectUri.length > 2048) return false;

  try {
    const parsedUri = new URL(redirectUri);
    // Reject localhost in production, allow only HTTPS
    if (
      process.env.NODE_ENV === "production" &&
      parsedUri.protocol !== "https:"
    ) {
      return false;
    }
    // Check against whitelist
    return allowedUris.includes(redirectUri);
  } catch {
    return false;
  }
}

function validateScope(scope: unknown, allowedScopes: string[]): boolean {
  if (typeof scope !== "string") return false;
  if (scope.length === 0 || scope.length > MAX_SCOPE_LENGTH) return false;

  const requestedScopes = scope.split(" ");
  return requestedScopes.every((s) => allowedScopes.includes(s));
}

function validateState(state: unknown): boolean {
  if (typeof state !== "string") return false;
  if (state.length === 0 || state.length > MAX
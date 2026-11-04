```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";
import crypto from "crypto";
import { URL } from "url";

const app = express();
const client = new Anthropic();

// In-memory storage for demo purposes - use secure persistent storage in production
const authorizationCodes = new Map<
  string,
  {
    code: string;
    clientId: string;
    redirectUri: string;
    scope: string;
    expiresAt: number;
    userId: string;
  }
>();

const registeredClients = new Map<
  string,
  {
    clientId: string;
    clientSecret: string;
    redirectUris: string[];
    name: string;
  }
>();

// Register a test client
registeredClients.set("test-client-123", {
  clientId: "test-client-123",
  clientSecret: crypto.randomBytes(32).toString("hex"),
  redirectUris: ["http://localhost:3001/callback"],
  name: "Test Client",
});

// Secure configuration defaults
const CONFIG = {
  CODE_EXPIRY_MS: 10 * 60 * 1000, // 10 minutes
  MAX_SCOPE_LENGTH: 500,
  MAX_STATE_LENGTH: 500,
  MAX_REDIRECT_URI_LENGTH: 2048,
  ALLOWED_RESPONSE_TYPES: ["code"],
  ALLOWED_SCOPES: ["openid", "profile", "email"],
  TOKEN_LENGTH: 32,
};

// Helper function to validate URL
function isValidRedirectUri(
  redirectUri: string,
  allowedUris: string[]
): boolean {
  try {
    const parsedUri = new URL(redirectUri);

    // Reject non-HTTPS in production (allow HTTP only for localhost)
    if (
      parsedUri.protocol !== "https:" &&
      !parsedUri.hostname.includes("localhost") &&
      parsedUri.hostname !== "127.0.0.1"
    ) {
      return false;
    }

    // Exact match required - no partial matches or wildcards
    return allowedUris.some((allowed) => allowed === redirectUri);
  } catch {
    return false;
  }
}

// Helper function to validate scopes
function validateScopes(scopes: string): boolean {
  if (!scopes || scopes.length === 0) {
    return false;
  }

  if (scopes.length > CONFIG.MAX_SCOPE_LENGTH) {
    return false;
  }

  const requestedScopes = scopes.split(" ");
  return requestedScopes.every((scope) =>
    CONFIG.ALLOWED_SCOPES.includes(scope)
  );
}

// Helper function to generate secure random token
function generateSecureToken(length: number): string {
  return crypto.randomBytes(length).toString("hex");
}

// Helper function to validate state parameter
function validateState(state: string | undefined): boolean {
  if (!state) {
    return false;
  }

  if (state.length > CONFIG.MAX_STATE_LENGTH) {
    return false;
  }

  // State should only contain alphanumeric, hyphen, period, underscore, and tilde
  return /^[a-zA-Z0-9\-._~]+$/.test(state);
}

export async function handleAuthorizationRequest(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Extract and validate query parameters
    const clientId = req.query.client_id as string;
    const redirectUri = req.query.redirect_uri
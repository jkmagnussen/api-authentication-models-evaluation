```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";
import crypto from "crypto";
import url from "url";

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Initialize Anthropic client for security analysis
const client = new Anthropic();

// In-memory store for authorization codes and tokens (use database in production)
const authorizationCodes = new Map<
  string,
  {
    clientId: string;
    redirectUri: string;
    scope: string;
    userId: string;
    expiresAt: number;
  }
>();

const refreshTokens = new Map<
  string,
  {
    clientId: string;
    userId: string;
    scope: string;
    createdAt: number;
  }
>();

// Registered OAuth clients (use database in production)
const registeredClients = new Map<
  string,
  {
    clientSecret: string;
    redirectUris: string[];
    allowedScopes: string[];
  }
>();

// Register a test client
registeredClients.set("test-client", {
  clientSecret: crypto.randomBytes(32).toString("hex"),
  redirectUris: ["http://localhost:3001/callback"],
  allowedScopes: ["read", "write", "profile"],
});

// Configuration constants (secure defaults)
const CONFIG = {
  AUTHORIZATION_CODE_EXPIRY_MS: 10 * 60 * 1000, // 10 minutes
  REFRESH_TOKEN_EXPIRY_MS: 30 * 24 * 60 * 60 * 1000, // 30 days
  ACCESS_TOKEN_EXPIRY_MS: 60 * 60 * 1000, // 1 hour
  MAX_SCOPE_LENGTH: 500,
  MAX_STATE_LENGTH: 500,
  ALLOWED_GRANT_TYPES: ["authorization_code", "refresh_token"],
  ALLOWED_RESPONSE_TYPES: ["code"],
};

// Helper function to validate redirect URI
function isValidRedirectUri(
  clientId: string,
  redirectUri: string
): boolean {
  const client = registeredClients.get(clientId);
  if (!client) {
    return false;
  }

  try {
    // Validate URI format
    const parsedUri = new url.URL(redirectUri);

    // Only allow HTTPS in production (secure default)
    if (
      process.env.NODE_ENV === "production" &&
      parsedUri.protocol !== "https:"
    ) {
      return false;
    }

    // Check against registered redirect URIs
    return client.redirectUris.some((registered) => registered === redirectUri);
  } catch {
    return false;
  }
}

// Helper function to validate scope
function isValidScope(clientId: string, scope: string): boolean {
  const client = registeredClients.get(clientId);
  if (!client) {
    return false;
  }

  if (!scope || scope.length === 0 || scope.length > CONFIG.MAX_SCOPE_LENGTH) {
    return false;
  }

  const requestedScopes = scope.split(" ");
  return requestedScopes.every((s) =>
    client.allowedScopes.includes(s.trim())
  );
}

// Helper function to validate state parameter
function isValidState(state: string): boolean {
  if (!state || state.length === 0 || state.length > CONFIG.MAX_STATE_LENGTH) {
    return false;
  }
  // State should be alphan
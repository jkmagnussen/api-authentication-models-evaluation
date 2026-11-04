```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextlewareFunction } from "express";
import crypto from "crypto";
import url from "url";

const app = express();
const client = new Anthropic();

// In-memory store for authorization codes (use secure session storage in production)
const authorizationCodes = new Map<
  string,
  {
    clientId: string;
    userId: string;
    redirectUri: string;
    scope: string[];
    expiresAt: number;
    codeChallenge?: string;
  }
>();

// In-memory store for registered clients (use database in production)
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
  allowedScopes: ["openid", "profile", "email"],
});

// Secure defaults and validation constants
const AUTHORIZATION_CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const TOKEN_EXPIRY_MS = 3600 * 1000; // 1 hour
const MAX_SCOPE_LENGTH = 500;
const MAX_CLIENT_ID_LENGTH = 255;
const MAX_REDIRECT_URI_LENGTH = 2048;
const MAX_STATE_LENGTH = 500;
const ALLOWED_RESPONSE_TYPES = ["code"];
const ALLOWED_GRANT_TYPES = ["authorization_code"];

// Validation functions
function validateClientId(clientId: unknown): clientId is string {
  if (typeof clientId !== "string") {
    return false;
  }
  if (clientId.length === 0 || clientId.length > MAX_CLIENT_ID_LENGTH) {
    return false;
  }
  // Only allow alphanumeric, hyphen, underscore
  return /^[a-zA-Z0-9\-_]+$/.test(clientId);
}

function validateRedirectUri(redirectUri: unknown): redirectUri is string {
  if (typeof redirectUri !== "string") {
    return false;
  }
  if (
    redirectUri.length === 0 ||
    redirectUri.length > MAX_REDIRECT_URI_LENGTH
  ) {
    return false;
  }
  try {
    const parsed = new URL(redirectUri);
    // Must be HTTPS in production, HTTP allowed for localhost
    if (
      parsed.protocol !== "https:" &&
      !parsed.hostname.startsWith("localhost") &&
      parsed.hostname !== "127.0.0.1"
    ) {
      return false;
    }
    // No fragment allowed in redirect URI
    if (parsed.hash) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function validateScope(scope: unknown): scope is string {
  if (typeof scope !== "string") {
    return false;
  }
  if (scope.length === 0 || scope.length > MAX_SCOPE_LENGTH) {
    return false;
  }
  // Only allow alphanumeric, space, and hyphen
  return /^[a-zA-Z0-9\s\-]+$/.test(scope);
}

function validateState(state: unknown): state is string {
  if (typeof state !== "string") {
    return false;
  }
  if (state.length === 0 ||
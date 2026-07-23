```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import url from "url";

const app = express();
const client = new Anthropic();

app.use(express.json());

// In-memory state store - use Redis in production
const activeStateTokens = new Map<
  string,
  { expires: number; clientId: string; redirectUri: string }
>();

// Allowed scopes for OAuth2
const ALLOWED_SCOPES = new Set(["read", "write", "delete", "admin"]);

// Registered OAuth2 clients
const REGISTERED_CLIENTS = new Map([
  [
    "client_abc123",
    {
      secret: "secret_xyz789",
      redirectUris: [
        "http://localhost:3001/callback",
        "https://app.example.com/auth/callback",
      ],
    },
  ],
  [
    "client_def456",
    {
      secret: "secret_uvw456",
      redirectUris: ["https://mobile.example.com/oauth/return"],
    },
  ],
]);

// Validate and normalize redirect URI
function validateRedirectUri(
  redirectUri: string,
  clientId: string
): { valid: boolean; error?: string } {
  if (!redirectUri || typeof redirectUri !== "string") {
    return { valid: false, error: "redirect_uri is required and must be a string" };
  }

  try {
    const parsed = new url.URL(redirectUri);
    if (!parsed.protocol.match(/^https?:$/)) {
      return {
        valid: false,
        error: "redirect_uri must use http or https protocol",
      };
    }
  } catch {
    return { valid: false, error: "redirect_uri must be a valid URL" };
  }

  const client = REGISTERED_CLIENTS.get(clientId);
  if (!client) {
    return { valid: false, error: "Unknown client_id" };
  }

  if (!client.redirectUris.includes(redirectUri)) {
    return {
      valid: false,
      error: "redirect_uri not registered for this client",
    };
  }

  return { valid: true };
}

// Validate scope parameter
function validateScopes(requestedScopes: string): {
  valid: boolean;
  scopes?: string[];
  error?: string;
} {
  if (!requestedScopes || typeof requestedScopes !== "string") {
    return { valid: false, error: "scope is required and must be a string" };
  }

  const scopes = requestedScopes.split(" ").filter((s) => s.length > 0);

  if (scopes.length === 0) {
    return { valid: false, error: "scope cannot be empty" };
  }

  const invalidScopes = scopes.filter((s) => !ALLOWED_SCOPES.has(s));
  if (invalidScopes.length > 0) {
    return {
      valid: false,
      error: `Invalid scopes: ${invalidScopes.join(", ")}`,
    };
  }

  return { valid: true, scopes };
}

// Generate secure state token
function generateStateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Store state token
function storeStateToken(
  state: string,
  clientId: string,
  redirectUri: string
): void {
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minute expiry
  activeStateToken
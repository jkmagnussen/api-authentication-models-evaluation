```typescript
import Anthropic from "@anthropic-ai/sdk";
import Express, { Request, Response } from "express";
import crypto from "crypto";
import { URLSearchParams } from "url";

const client = new Anthropic();
const app = Express();

const allowedRedirectUrls = new Set([
  "https://app.example.com/callback",
  "https://app.example.com/auth/callback",
  "http://localhost:3000/oauth/callback",
]);

const validScopes = new Set(["read", "write", "delete", "admin"]);

const stateCache = new Map<string, StateData>();

interface StateData {
  timestamp: number;
  clientId: string;
  requestedScopes: string[];
}

function generateSecureState(): string {
  return crypto.randomBytes(32).toString("hex");
}

function validateRedirectLocation(
  redirectUri: string
): { valid: boolean; error?: string } {
  if (!redirectUri) {
    return { valid: false, error: "Redirect URI is required" };
  }

  try {
    const parsedUrl = new URL(redirectUri);
    if (parsedUrl.hash || parsedUrl.search.includes("code=")) {
      return { valid: false, error: "Invalid redirect URI format" };
    }
  } catch {
    return { valid: false, error: "Invalid redirect URI URL format" };
  }

  if (!allowedRedirectUrls.has(redirectUri)) {
    return {
      valid: false,
      error: `Redirect URI not registered: ${redirectUri}`,
    };
  }

  return { valid: true };
}

function validateRequestedScopes(scopes: string): {
  valid: boolean;
  parsedScopes?: string[];
  error?: string;
} {
  if (!scopes) {
    return { valid: false, error: "Scopes are required" };
  }

  const scopeArray = scopes.split(" ").filter((s) => s.length > 0);

  if (scopeArray.length === 0) {
    return { valid: false, error: "At least one scope must be requested" };
  }

  const invalidScopes = scopeArray.filter((scope) => !validScopes.has(scope));

  if (invalidScopes.length > 0) {
    return {
      valid: false,
      error: `Invalid scopes requested: ${invalidScopes.join(", ")}`,
    };
  }

  return { valid: true, parsedScopes: scopeArray };
}

function validateClientId(clientId: string): {
  valid: boolean;
  error?: string;
} {
  if (!clientId) {
    return { valid: false, error: "Client ID is required" };
  }

  if (!/^[a-zA-Z0-9_-]{20,}$/.test(clientId)) {
    return {
      valid: false,
      error: "Client ID format is invalid",
    };
  }

  return { valid: true };
}

function validateStateParameter(state: string): {
  valid: boolean;
  error?: string;
} {
  if (!state) {
    return { valid: false, error: "State parameter is required" };
  }

  if (state.length < 32) {
    return {
      valid: false,
      error: "State parameter is too short (minimum 32 characters)",
    };
  }

  return { valid: true };
}

function cleanExpiredStates(): void {
  const now = Date.now();
  const maxAge = 10 * 60 * 1000;
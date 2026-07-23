```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import url from "url";

const app = express();
const client = new Anthropic();

// Configuration with secure defaults
const OAUTH_CONFIG = {
  VALID_REDIRECT_URIS: [
    "http://localhost:3000/callback",
    "http://localhost:3001/oauth/return",
    "https://app.example.com/auth/callback",
  ],
  ALLOWED_SCOPES: ["openid", "profile", "email", "offline_access"],
  STATE_VALIDITY_MINUTES: 10,
  MAX_STATE_LENGTH: 128,
};

// In-memory state store (use Redis in production)
const stateStore = new Map<string, { createdAt: number; clientId: string }>();

// Validate redirect URI against whitelist
export function validateRedirectUri(redirectUri: string): boolean {
  if (!redirectUri || typeof redirectUri !== "string") {
    return false;
  }

  try {
    const parsedUri = new url.URL(redirectUri);
    return OAUTH_CONFIG.VALID_REDIRECT_URIS.some(
      (validUri) => new url.URL(validUri).href === parsedUri.href
    );
  } catch {
    return false;
  }
}

// Validate requested scopes
export function validateScopes(requestedScopes: string): string[] {
  if (!requestedScopes || typeof requestedScopes !== "string") {
    return [];
  }

  const scopes = requestedScopes.split(" ").filter((scope) => scope.length > 0);
  return scopes.filter((scope) =>
    OAUTH_CONFIG.ALLOWED_SCOPES.includes(scope.toLowerCase())
  );
}

// Generate secure state parameter
export function generateStateParameter(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Validate state parameter format and existence
export function validateStateParameter(state: string): boolean {
  if (!state || typeof state !== "string") {
    return false;
  }

  if (state.length > OAUTH_CONFIG.MAX_STATE_LENGTH) {
    return false;
  }

  return /^[a-f0-9]{64}$/.test(state);
}

// Store state with timestamp
export function storeState(
  state: string,
  clientId: string
): { success: boolean; error?: string } {
  if (!validateStateParameter(state)) {
    return { success: false, error: "Invalid state format" };
  }

  if (!clientId || typeof clientId !== "string" || clientId.length > 256) {
    return { success: false, error: "Invalid client ID" };
  }

  stateStore.set(state, {
    createdAt: Date.now(),
    clientId,
  });

  return { success: true };
}

// Verify and consume state parameter
export function verifyState(
  state: string
): { valid: boolean; clientId?: string; error?: string } {
  if (!validateStateParameter(state)) {
    return { valid: false, error: "Invalid state format" };
  }

  const storedState = stateStore.get(state);
  if (!storedState) {
    return { valid: false, error: "State not found or expired" };
  }

  const age = Date.now() - storedState.createdAt;
  if (age > OAUTH_CONFIG.STATE_VALIDITY_MINUTES * 60 * 1000) {
    stateStore.delete(
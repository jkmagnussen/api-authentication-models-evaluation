```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const app = express();
const client = new Anthropic();

// Configuration with secure defaults
const OAUTH_CONFIG = {
  authorizedRedirectUris: [
    "https://app.example.com/callback",
    "http://localhost:3000/oauth/callback",
  ],
  supportedScopes: ["openid", "profile", "email", "offline_access"],
  stateTokenTtl: 600000, // 10 minutes
  tokenLength: 32,
};

// In-memory state store (use Redis in production)
const stateTokenStore = new Map<
  string,
  { expiresAt: number; clientId: string; redirectUri: string }
>();

// Validate redirect URI against whitelist
function validateRedirectUri(redirectUri: string): boolean {
  if (!redirectUri) return false;

  try {
    const url = new URL(redirectUri);
    // Only allow https in production
    if (
      process.env.NODE_ENV === "production" &&
      url.protocol !== "https:"
    ) {
      return false;
    }
    return OAUTH_CONFIG.authorizedRedirectUris.includes(redirectUri);
  } catch {
    return false;
  }
}

// Validate scopes against approved list
function validateScopes(requestedScopes: string[]): {
  valid: boolean;
  approved: string[];
} {
  if (!Array.isArray(requestedScopes) || requestedScopes.length === 0) {
    return { valid: false, approved: [] };
  }

  const approved = requestedScopes.filter((scope) =>
    OAUTH_CONFIG.supportedScopes.includes(scope)
  );

  return {
    valid: approved.length > 0,
    approved,
  };
}

// Generate cryptographically secure state token
function generateStateToken(): string {
  return crypto.randomBytes(OAUTH_CONFIG.tokenLength).toString("hex");
}

// Validate state token and check expiration
function validateStateToken(
  state: string,
  clientId: string
): { valid: boolean; redirectUri?: string } {
  const tokenData = stateTokenStore.get(state);

  if (!tokenData) {
    return { valid: false };
  }

  if (Date.now() > tokenData.expiresAt) {
    stateTokenStore.delete(state);
    return { valid: false };
  }

  if (tokenData.clientId !== clientId) {
    return { valid: false };
  }

  return { valid: true, redirectUri: tokenData.redirectUri };
}

// Express route handler for authorization endpoint
export async function handleAuthorizationRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { client_id, redirect_uri, scope, response_type, state } = req.query;

    // Validate required parameters
    if (!client_id || typeof client_id !== "string") {
      res.status(400).json({ error: "invalid_request", error_description: "Missing client_id" });
      return;
    }

    if (!redirect_uri || typeof redirect_uri !== "string") {
      res.status(400).json({ error: "invalid_request", error_description: "Missing redirect_uri" });
      return;
    }

    if (!state || typeof state !== "string") {
      res.status(400).json({ error: "invalid_request", error_description: "Missing state parameter" });
```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";
import { randomBytes } from "crypto";
import { createServer } from "http";

const app = express();
const client = new Anthropic();

// Configuration
const VALID_CLIENT_IDS = new Set(["test-client-123", "mobile-app-456"]);
const ALLOWED_SCOPES = new Set([
  "read:profile",
  "write:data",
  "email",
  "offline_access",
]);
const VALID_REDIRECT_DOMAINS = new Set([
  "localhost:3000",
  "localhost:3001",
  "app.example.com",
  "mobile.example.com",
]);
const STATE_STORE = new Map<string, StateData>();

interface StateData {
  timestamp: number;
  clientId: string;
  requestedScopes: string[];
}

interface AuthorizationRequest {
  clientId: string;
  redirectUri: string;
  scopes: string[];
  state: string;
}

// Validate redirect URI against whitelist
function validateRedirectUri(uri: string): boolean {
  try {
    const url = new URL(uri);
    const domain = `${url.hostname}${url.port ? `:${url.port}` : ""}`;
    return VALID_REDIRECT_DOMAINS.has(domain) && url.protocol === "https:";
  } catch {
    return false;
  }
}

// Validate scopes
function validateScopes(scopes: string[]): boolean {
  if (!scopes || scopes.length === 0) return false;
  return scopes.every((scope) => ALLOWED_SCOPES.has(scope));
}

// Validate state parameter format
function validateStateFormat(state: string): boolean {
  return state.length >= 32 && state.length <= 500 && /^[a-zA-Z0-9_-]+$/.test(state);
}

// Generate authorization code
function generateAuthCode(): string {
  return randomBytes(32).toString("hex");
}

// Middleware for request validation
async function validateAuthRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { client_id, redirect_uri, scope, state } = req.query;

  // Validate required parameters
  if (!client_id || typeof client_id !== "string") {
    res.status(400).json({ error: "invalid_request", error_description: "Missing client_id" });
    return;
  }

  if (!redirect_uri || typeof redirect_uri !== "string") {
    res.status(400).json({ error: "invalid_request", error_description: "Missing redirect_uri" });
    return;
  }

  if (!scope || typeof scope !== "string") {
    res.status(400).json({ error: "invalid_scope", error_description: "Missing scope" });
    return;
  }

  if (!state || typeof state !== "string") {
    res.status(400).json({ error: "invalid_request", error_description: "Missing state" });
    return;
  }

  // Validate client_id
  if (!VALID_CLIENT_IDS.has(client_id)) {
    res.status(401).json({ error: "unauthorized_client", error_description: "Unknown client" });
    return;
  }

  // Validate redirect URI
  if (!validateRedirectUri(redirect_uri)) {
    res.status(400).json({ error: "invalid_request", error_description: "Invalid redirect_uri" });
    return;
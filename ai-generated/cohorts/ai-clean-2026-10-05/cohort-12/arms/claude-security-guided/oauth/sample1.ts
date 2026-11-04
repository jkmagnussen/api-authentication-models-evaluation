```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";
import crypto from "crypto";

const client = new Anthropic();

// In-memory storage for demo purposes - use secure database in production
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
  }
>();

// Registered clients - in production, fetch from secure database
const registeredClients = new Map<
  string,
  {
    clientSecret: string;
    redirectUris: string[];
    allowedScopes: string[];
  }
>();

// Initialize with a test client
registeredClients.set("test-client", {
  clientSecret: "test-secret-123",
  redirectUris: ["http://localhost:3001/callback"],
  allowedScopes: ["read", "write", "profile"],
});

// Utility functions with secure defaults
function validateClientId(clientId: unknown): boolean {
  if (typeof clientId !== "string") return false;
  if (clientId.length < 3 || clientId.length > 128) return false;
  return /^[a-zA-Z0-9_-]+$/.test(clientId);
}

function validateRedirectUri(redirectUri: unknown): boolean {
  if (typeof redirectUri !== "string") return false;
  if (redirectUri.length < 10 || redirectUri.length > 2048) return false;
  try {
    const url = new URL(redirectUri);
    // Only allow https in production, http only for localhost in dev
    if (
      url.protocol !== "https:" &&
      !(url.protocol === "http:" && url.hostname === "localhost")
    ) {
      return false;
    }
    // Reject URIs with fragments
    if (url.hash) return false;
    return true;
  } catch {
    return false;
  }
}

function validateScope(scope: unknown, allowedScopes: string[]): boolean {
  if (typeof scope !== "string") return false;
  if (scope.length === 0 || scope.length > 256) return false;
  const requestedScopes = scope.split(" ");
  return requestedScopes.every((s) => allowedScopes.includes(s));
}

function validateResponseType(responseType: unknown): boolean {
  return responseType === "code" || responseType === "token";
}

function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

function validateState(state: unknown): boolean {
  if (typeof state !== "string") return false;
  if (state.length < 10 || state.length > 500) return false;
  return /^[a-zA-Z0-9_-]+$/.test(state);
}

// Express app setup
export const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Authorization endpoint
export async function handleAuthorization(
  req: Request,
  res: Response
): Promise<void> {
  // Extract and validate all input parameters with fail-closed approach
  const clientId = req.query.client_id;
  const redirectUri = req.query.redirect_uri;
  const scope = req.query.scope;
  const responseType = req.query.response_type;
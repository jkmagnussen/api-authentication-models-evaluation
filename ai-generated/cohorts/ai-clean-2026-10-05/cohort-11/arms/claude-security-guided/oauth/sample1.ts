```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";
import crypto from "crypto";
import url from "url";

const app = express();
const client = new Anthropic();

// In-memory storage for authorization codes and clients (in production, use a database)
const authorizationCodes = new Map<
  string,
  {
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
    clientSecret: string;
    redirectUris: string[];
    name: string;
  }
>();

// Register a test client
registeredClients.set("test-client-id", {
  clientSecret: "test-client-secret",
  redirectUris: [
    "http://localhost:3001/callback",
    "https://example.com/callback",
  ],
  name: "Test OAuth Client",
});

// Constants for secure defaults
const CODE_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutes
const CODE_LENGTH = 32;
const ALLOWED_RESPONSE_TYPES = ["code"];
const ALLOWED_SCOPES = ["openid", "profile", "email"];
const REQUIRED_PARAMETERS = ["client_id", "redirect_uri", "response_type"];

// Utility functions
function generateAuthorizationCode(): string {
  return crypto.randomBytes(CODE_LENGTH).toString("hex");
}

function validateUrl(urlString: string): boolean {
  try {
    const parsed = new url.URL(urlString);
    // Only allow http and https protocols for security
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function validateClientId(clientId: string): boolean {
  // Validate format: alphanumeric and hyphens only
  return /^[a-zA-Z0-9\-]{1,50}$/.test(clientId);
}

function validateScope(scope: string): boolean {
  if (!scope || typeof scope !== "string") {
    return false;
  }

  const requestedScopes = scope.split(" ");
  return requestedScopes.every((s) => ALLOWED_SCOPES.includes(s));
}

export async function handleAuthorizationRequest(
  req: Request,
  res: Response
): Promise<void> {
  // Fail closed: assume invalid until proven otherwise
  const errors: string[] = [];

  // Extract and validate required parameters
  const clientId = req.query.client_id as string;
  const redirectUri = req.query.redirect_uri as string;
  const responseType = req.query.response_type as string;
  const scope = (req.query.scope as string) || "openid";
  const state = req.query.state as string;

  // Validate all required parameters are present
  for (const param of REQUIRED_PARAMETERS) {
    if (!req.query[param]) {
      errors.push(`Missing required parameter: ${param}`);
    }
  }

  // Validate client_id format
  if (clientId && !validateClientId(clientId)) {
    errors.push("Invalid client_id format");
  }

  // Validate client_id exists
  if (clientId && !registeredClients.has(clientId)) {
    errors.push("Client not registered");
  }

  // Validate redirect_uri format
  if (redirectUri && !validateUrl(redirectUri)) {
    errors.push("Invalid redirect_uri format
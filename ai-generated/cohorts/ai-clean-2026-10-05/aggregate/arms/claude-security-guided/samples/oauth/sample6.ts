```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";
import crypto from "crypto";

const client = new Anthropic();
const app = express();

// In-memory storage for authorization codes and tokens (use database in production)
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
    expiresAt: number;
  }
>();

// Registered OAuth clients (use database in production)
const registeredClients = new Map<
  string,
  {
    clientSecret: string;
    redirectUris: string[];
    name: string;
  }
>();

// Initialize with a test client
registeredClients.set("test-client", {
  clientSecret: "test-secret-key-12345",
  redirectUris: [
    "http://localhost:3001/callback",
    "https://example.com/callback",
  ],
  name: "Test OAuth Client",
});

// Utility functions
function generateRandomToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

function validateUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

function validateScope(scope: string): boolean {
  const validScopes = ["read", "write", "delete", "profile"];
  const requestedScopes = scope.split(" ");
  return (
    requestedScopes.length > 0 &&
    requestedScopes.every((s) => validScopes.includes(s))
  );
}

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Request validation middleware
function validateOAuthRequest(
  req: Request,
  _res: Response,
  next: Function
): void {
  req.oauthValidation = {
    errors: [] as string[],
  };
  next();
}

app.use(validateOAuthRequest);

// Authorization endpoint
export async function handleAuthorizationEndpoint(
  req: Request,
  res: Response
): Promise<void> {
  const {
    client_id,
    redirect_uri,
    response_type,
    scope,
    state,
    nonce,
  } = req.query;

  // Validate required parameters
  if (!client_id || typeof client_id !== "string") {
    res.status(400).json({ error: "invalid_request", error_description: "Missing or invalid client_id" });
    return;
  }

  if (!redirect_uri || typeof redirect_uri !== "string") {
    res.status(400).json({ error: "invalid_request", error_description: "Missing or invalid redirect_uri" });
    return;
  }

  if (!response_type || response_type !== "code") {
    res.status(400).json({ error: "unsupported_response_type", error_description: "Only 'code' response type is supported" });
    return;
  }

  if (!scope || typeof scope !== "string") {
    res.status(400).json({ error: "invalid_scope", error_description: "Missing or invalid scope" });
    return;
  }
```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const app = express();
const client = new Anthropic();

// In-memory storage for demo purposes
const authorizationCodes: Map<
  string,
  {
    clientId: string;
    redirectUri: string;
    scope: string;
    userId: string;
    expiresAt: number;
  }
> = new Map();

const authorizationRequests: Map<
  string,
  {
    clientId: string;
    redirectUri: string;
    scope: string;
    state: string;
    codeChallenge?: string;
    codeChallengeMethod?: string;
  }
> = new Map();

const registeredClients: Map<
  string,
  {
    clientSecret: string;
    redirectUris: string[];
    name: string;
  }
> = new Map([
  [
    "test-client-123",
    {
      clientSecret: "test-secret-456",
      redirectUris: ["http://localhost:3001/callback"],
      name: "Test OAuth Client",
    },
  ],
]);

const authenticatedUsers: Map<string, { userId: string; email: string }> =
  new Map([
    ["user1", { userId: "user-123", email: "user@example.com" }],
  ]);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper function to generate authorization code
function generateAuthorizationCode(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Helper function to validate client
function validateClient(
  clientId: string,
  redirectUri: string
): { valid: boolean; error?: string } {
  const client = registeredClients.get(clientId);
  if (!client) {
    return { valid: false, error: "Invalid client_id" };
  }
  if (!client.redirectUris.includes(redirectUri)) {
    return { valid: false, error: "Invalid redirect_uri" };
  }
  return { valid: true };
}

// Authorization endpoint
export const authorizationEndpoint = (req: Request, res: Response) => {
  const {
    client_id,
    redirect_uri,
    response_type,
    scope,
    state,
    code_challenge,
    code_challenge_method,
  } = req.query;

  // Validate required parameters
  if (!client_id || !redirect_uri || !response_type || !state) {
    return res.status(400).json({
      error: "invalid_request",
      error_description: "Missing required parameters",
    });
  }

  if (response_type !== "code") {
    return res.status(400).json({
      error: "unsupported_response_type",
      error_description: "Only authorization code flow is supported",
    });
  }

  // Validate client
  const validation = validateClient(
    client_id as string,
    redirect_uri as string
  );
  if (!validation.valid) {
    return res.status(400).json({
      error: "invalid_client",
      error_description: validation.error,
    });
  }

  // Store authorization request
  const requestId = crypto.randomBytes(16).toString("hex");
  authorizationRequests.set(requestId, {
    clientId: client_id as string,
    redirectUri: redirect_uri as string,
    scope: (scope as string) || "openid profile email",
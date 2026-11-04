```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";
import crypto from "crypto";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const client = new Anthropic();

// In-memory storage for authorization codes and tokens
const authorizationCodes = new Map<
  string,
  {
    clientId: string;
    redirectUri: string;
    scope: string;
    expiresAt: number;
  }
>();
const accessTokens = new Map<
  string,
  {
    clientId: string;
    scope: string;
    expiresAt: number;
  }
>();

// Registered OAuth clients
const registeredClients = new Map<
  string,
  {
    clientSecret: string;
    redirectUris: string[];
    name: string;
  }
>();

// Initialize with sample clients
registeredClients.set("client_123", {
  clientSecret: "secret_456",
  redirectUris: ["http://localhost:3000/callback"],
  name: "Sample Client App",
});

function generateAuthorizationCode(): string {
  return crypto.randomBytes(32).toString("hex");
}

function generateAccessToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function validateClientId(clientId: string): boolean {
  return registeredClients.has(clientId);
}

function validateRedirectUri(clientId: string, redirectUri: string): boolean {
  const client = registeredClients.get(clientId);
  return client ? client.redirectUris.includes(redirectUri) : false;
}

export const authorizationEndpoint = (req: Request, res: Response) => {
  const {
    client_id,
    redirect_uri,
    scope,
    state,
    response_type,
    response_mode,
  } = req.query;

  // Validate required parameters
  if (!client_id || !redirect_uri || !response_type) {
    return res.status(400).json({
      error: "invalid_request",
      error_description:
        "Missing required parameters: client_id, redirect_uri, response_type",
    });
  }

  if (response_type !== "code") {
    return res.status(400).json({
      error: "unsupported_response_type",
      error_description: "Only 'code' response type is supported",
    });
  }

  // Validate client_id
  if (!validateClientId(client_id as string)) {
    return res.status(401).json({
      error: "invalid_client",
      error_description: "Unknown client_id",
    });
  }

  // Validate redirect_uri
  if (!validateRedirectUri(client_id as string, redirect_uri as string)) {
    return res.status(400).json({
      error: "invalid_request",
      error_description:
        "Invalid redirect_uri for this client_id. The redirect_uri does not match any registered URIs.",
    });
  }

  // Generate authorization code
  const authCode = generateAuthorizationCode();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  authorizationCodes.set(authCode, {
    clientId: client_id as string,
    redirectUri: redirect_uri as string,
    scope: (scope as string) || "openid profile",
    expiresAt,
  });

  // Build redirect URL
  let redirectUrl = `${redirect_uri}?code=${
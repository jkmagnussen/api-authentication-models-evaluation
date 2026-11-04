```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";

const client = new Anthropic();
const app = express();

// In-memory store for authorization codes and tokens
const authorizationCodes = new Map<
  string,
  { clientId: string; redirectUri: string; scope: string; expiresAt: number }
>();
const accessTokens = new Map<
  string,
  {
    clientId: string;
    scope: string;
    userId: string;
    expiresAt: number;
  }
>();
const refreshTokens = new Map<
  string,
  { clientId: string; userId: string; expiresAt: number }
>();

// Registered clients
const registeredClients = new Map<
  string,
  { clientSecret: string; redirectUris: string[] }
>();

// Initialize with sample clients
registeredClients.set("client_123", {
  clientSecret: "secret_456",
  redirectUris: [
    "http://localhost:3001/callback",
    "http://localhost:3001/oauth/callback",
  ],
});

function generateRandomString(length: number): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const authorizationEndpoint = (req: Request, res: Response) => {
  const {
    client_id,
    redirect_uri,
    response_type,
    scope,
    state,
  } = req.query as {
    client_id?: string;
    redirect_uri?: string;
    response_type?: string;
    scope?: string;
    state?: string;
  };

  // Validate request parameters
  if (!client_id || !redirect_uri || !response_type || !scope) {
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
  const client = registeredClients.get(client_id);
  if (!client) {
    return res.status(401).json({
      error: "invalid_client",
      error_description: "Client not registered",
    });
  }

  // Validate redirect URI
  if (!client.redirectUris.includes(redirect_uri)) {
    return res.status(400).json({
      error: "invalid_request",
      error_description: "Redirect URI not registered for this client",
    });
  }

  // Generate authorization code
  const code = generateRandomString(32);
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  authorizationCodes.set(code, {
    clientId: client_id,
    redirectUri: redirect_uri,
    scope: scope,
    expiresAt: expiresAt,
  });

  // Redirect to client with authorization code
  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.append("code", code);
  if (state) {
    redirectUrl
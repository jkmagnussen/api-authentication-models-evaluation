```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";
import crypto from "crypto";
import querystring from "querystring";

const app = express();
const client = new Anthropic();

// In-memory storage for authorization codes and tokens
const authorizationCodes = new Map<
  string,
  {
    clientId: string;
    redirectUri: string;
    scopes: string[];
    expiresAt: number;
  }
>();
const accessTokens = new Map<
  string,
  {
    clientId: string;
    scopes: string[];
    issuedAt: number;
    expiresAt: number;
  }
>();
const refreshTokens = new Map<
  string,
  {
    clientId: string;
    scopes: string[];
    issuedAt: number;
  }
>();

// Registered OAuth clients
const registeredClients = new Map<
  string,
  {
    clientSecret: string;
    redirectUris: string[];
    scopes: string[];
  }
>();

// Initialize with a sample client
registeredClients.set("sample-client", {
  clientSecret: "sample-client-secret",
  redirectUris: [
    "http://localhost:3001/callback",
    "http://localhost:3000/callback",
  ],
  scopes: ["openid", "profile", "email"],
});

function generateRandomToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

export const authorizationEndpoint = (req: Request, res: Response): void => {
  const {
    client_id,
    redirect_uri,
    response_type,
    scope,
    state,
    nonce,
    prompt,
  } = req.query;

  // Validate required parameters
  if (!client_id || !redirect_uri || response_type !== "code") {
    res.status(400).json({
      error: "invalid_request",
      error_description:
        "Missing or invalid required parameters (client_id, redirect_uri, response_type=code)",
    });
    return;
  }

  // Verify client exists
  const clientConfig = registeredClients.get(client_id as string);
  if (!clientConfig) {
    res.status(400).json({
      error: "invalid_client",
      error_description: "Client ID not recognized",
    });
    return;
  }

  // Verify redirect URI is registered
  if (!clientConfig.redirectUris.includes(redirect_uri as string)) {
    res.status(400).json({
      error: "invalid_request",
      error_description: "Redirect URI not registered for this client",
    });
    return;
  }

  // Parse requested scopes
  const requestedScopes = scope
    ? (scope as string).split(" ")
    : ["openid", "profile"];
  const validScopes = requestedScopes.filter((s) =>
    clientConfig.scopes.includes(s)
  );

  if (validScopes.length === 0) {
    res.status(400).json({
      error: "invalid_scope",
      error_description: "Requested scopes are not valid for this client",
    });
    return;
  }

  // Generate authorization code
  const authCode = generateRandomToken();
  const expiresAt = getCurrentTimestamp() + 600; // 10 minutes

  authorizationCodes.set(authCode, {
    client
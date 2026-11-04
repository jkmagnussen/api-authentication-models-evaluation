```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";
import crypto from "crypto";

const app = express();
const client = new Anthropic();

// In-memory storage for authorization codes and tokens
const authorizationCodes = new Map<
  string,
  { clientId: string; redirectUri: string; scope: string; expiresAt: number }
>();
const accessTokens = new Map<
  string,
  { clientId: string; scope: string; userId: string; expiresAt: number }
>();
const refreshTokens = new Map<
  string,
  { clientId: string; userId: string; expiresAt: number }
>();

// Registered OAuth clients
const registeredClients = new Map<
  string,
  { clientSecret: string; redirectUris: string[] }
>();

// Initialize with a test client
registeredClients.set("test-client", {
  clientSecret: "test-secret",
  redirectUris: ["http://localhost:3001/callback"],
});

function generateToken(length = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

function validateClientCredentials(
  clientId: string,
  clientSecret: string
): boolean {
  const client = registeredClients.get(clientId);
  return client ? client.clientSecret === clientSecret : false;
}

function validateRedirectUri(clientId: string, redirectUri: string): boolean {
  const client = registeredClients.get(clientId);
  return client ? client.redirectUris.includes(redirectUri) : false;
}

export const handleAuthorizationRequest = (req: Request, res: Response) => {
  const { client_id, redirect_uri, scope, response_type, state } = req.query;

  // Validate required parameters
  if (!client_id || !redirect_uri || !response_type) {
    return res.status(400).json({
      error: "invalid_request",
      error_description: "Missing required parameters",
    });
  }

  // Validate client and redirect URI
  if (!validateRedirectUri(client_id as string, redirect_uri as string)) {
    return res.status(400).json({
      error: "invalid_client",
      error_description: "Invalid client or redirect URI",
    });
  }

  if (response_type !== "code") {
    const redirectParams = new URLSearchParams({
      error: "unsupported_response_type",
    });
    if (state) redirectParams.append("state", state as string);
    return res.redirect(
      `${redirect_uri}?${redirectParams.toString()}`
    );
  }

  // Generate authorization code
  const code = generateToken();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  authorizationCodes.set(code, {
    clientId: client_id as string,
    redirectUri: redirect_uri as string,
    scope: (scope as string) || "openid profile email",
    expiresAt,
  });

  // Redirect back to client with authorization code
  const redirectParams = new URLSearchParams({
    code,
    state: (state as string) || "",
  });

  res.redirect(`${redirect_uri}?${redirectParams.toString()}`);
};

export const handleTokenRequest = (req: Request, res: Response) => {
  const { grant_type, code, redirect_uri, client_id, client_secret } = req.body;

  // Validate grant type
  if (grant_type === "authorization_code") {
    //
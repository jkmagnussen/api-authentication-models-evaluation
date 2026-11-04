```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";

const app = express();

interface OAuthRequest {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  state: string;
  nonce?: string;
}

interface OAuthClient {
  client_id: string;
  client_secret: string;
  redirect_uris: string[];
  scopes: string[];
}

// Simulated database of registered OAuth clients
const registeredClients: Map<string, OAuthClient> = new Map([
  [
    "test-client-1",
    {
      client_id: "test-client-1",
      client_secret: "test-secret-1",
      redirect_uris: ["https://example.com/callback"],
      scopes: ["openid", "profile", "email"],
    },
  ],
]);

// Simulated database of authorization codes (in production, use Redis or database)
const authorizationCodes: Map<
  string,
  {
    code: string;
    client_id: string;
    redirect_uri: string;
    scope: string;
    expires_at: number;
    user_id: string;
  }
> = new Map();

// Helper function to generate secure random strings
function generateSecureToken(length: number = 32): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let token = "";
  const values = new Uint8Array(length);
  crypto.getRandomValues(values);
  for (let i = 0; i < length; i++) {
    token += chars[values[i] % chars.length];
  }
  return token;
}

// Validate URL is properly formatted and safe
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow https and http (https preferred)
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

// Validate redirect URI matches registered URI exactly
function validateRedirectUri(
  client: OAuthClient,
  redirectUri: string
): boolean {
  return client.redirect_uris.includes(redirectUri);
}

// Validate requested scopes are within client's allowed scopes
function validateScopes(client: OAuthClient, requestedScopes: string): boolean {
  const scopes = requestedScopes.split(" ");
  return scopes.every((scope) => client.scopes.includes(scope));
}

// Validate OAuth request parameters
function validateOAuthRequest(
  params: Partial<OAuthRequest>
): { valid: boolean; error?: string } {
  // Check required parameters
  if (!params.client_id || typeof params.client_id !== "string") {
    return { valid: false, error: "invalid_request" };
  }

  if (!params.redirect_uri || typeof params.redirect_uri !== "string") {
    return { valid: false, error: "invalid_request" };
  }

  if (!params.response_type || typeof params.response_type !== "string") {
    return { valid: false, error: "invalid_request" };
  }

  if (!params.scope || typeof params.scope !== "string") {
    return { valid: false, error: "invalid_request" };
  }

  if (!params.state || typeof params.state !== "string") {
    return {
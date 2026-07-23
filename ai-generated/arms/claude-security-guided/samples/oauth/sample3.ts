```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import url from "url";

const client = new Anthropic();
const app = express();

interface OAuth2Request {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  state: string;
  nonce?: string;
}

interface ValidatedOAuthParams {
  isValid: boolean;
  errors: string[];
  sanitized?: {
    client_id: string;
    redirect_uri: string;
    scopes: string[];
    state: string;
    nonce?: string;
  };
}

const ALLOWED_CLIENTS = new Map([
  ["client_abc123", { name: "Web App", redirects: ["https://app.example.com/callback"] }],
  ["client_def456", { name: "Mobile App", redirects: ["https://mobile.example.com/auth/callback"] }],
]);

const VALID_SCOPES = new Set([
  "openid",
  "profile",
  "email",
  "phone",
  "address",
  "offline_access",
]);

const STATE_STORAGE = new Map<string, { timestamp: number; consumed: boolean }>();

function validateRedirectUri(clientId: string, redirectUri: string): boolean {
  const client = ALLOWED_CLIENTS.get(clientId);
  if (!client) return false;

  try {
    const parsedUrl = new url.URL(redirectUri);
    if (parsedUrl.protocol !== "https:") return false;
    return client.redirects.some((allowed) => allowed === redirectUri);
  } catch {
    return false;
  }
}

function validateStateParameter(state: string): boolean {
  if (!state || state.length < 32 || state.length > 500) return false;
  if (!/^[a-zA-Z0-9\-._~]{32,500}$/.test(state)) return false;
  return true;
}

function validateScopes(requestedScopes: string): { valid: boolean; scopes: string[] } {
  const scopes = requestedScopes.split(" ").filter((s) => s.length > 0);

  if (scopes.length === 0) return { valid: false, scopes: [] };
  if (scopes.length > 10) return { valid: false, scopes };

  for (const scope of scopes) {
    if (!VALID_SCOPES.has(scope)) {
      return { valid: false, scopes };
    }
  }

  return { valid: true, scopes };
}

export async function processAuthorizationRequest(
  params: OAuth2Request
): Promise<ValidatedOAuthParams> {
  const errors: string[] = [];

  if (!params.client_id || typeof params.client_id !== "string") {
    errors.push("Missing or invalid client_id parameter");
  }

  if (!ALLOWED_CLIENTS.has(params.client_id)) {
    errors.push("Client not registered");
  }

  if (!params.redirect_uri || typeof params.redirect_uri !== "string") {
    errors.push("Missing or invalid redirect_uri parameter");
  } else if (!validateRedirectUri(params.client_id, params.redirect_uri)) {
    errors.push("Redirect URI not registered for this client");
  }

  if (params.response_type !== "code") {
    errors.push("Invalid or missing response_type (only 'code' supported)");
  }

  if (!validateStateParameter(
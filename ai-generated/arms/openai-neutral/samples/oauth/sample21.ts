```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";
import crypto from "crypto";

const app = express();
app.use(express.json());

interface OAuthState {
  state: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  expiresAt: number;
  codeChallenge?: string;
}

interface ValidatedAuthRequest {
  clientId: string;
  redirectUri: string;
  requestedScopes: string[];
  state: string;
  codeChallenge?: string;
}

const ALLOWED_SCOPES = ["read:user", "write:posts", "delete:account"];
const ALLOWED_CLIENTS = new Map([
  ["client-123", "https://app.example.com"],
  ["client-456", "https://trusted-service.example.com"],
]);

const STATE_STORE = new Map<string, OAuthState>();
const STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export function generateSecureState(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function validateRedirectUri(
  clientId: string,
  redirectUri: string
): boolean {
  const registeredUri = ALLOWED_CLIENTS.get(clientId);
  if (!registeredUri) return false;

  try {
    const urlObj = new URL(redirectUri);
    const registeredObj = new URL(registeredUri);

    return (
      urlObj.protocol === registeredObj.protocol &&
      urlObj.hostname === registeredObj.hostname &&
      urlObj.port === registeredObj.port &&
      urlObj.pathname === registeredObj.pathname
    );
  } catch {
    return false;
  }
}

export function validateRequestedScopes(scopes: string[]): boolean {
  return (
    scopes.length > 0 &&
    scopes.every((scope) => ALLOWED_SCOPES.includes(scope))
  );
}

export function validateCodeChallenge(challenge: string): boolean {
  // PKCE code_challenge must be 43-128 characters of unreserved characters
  return /^[A-Za-z0-9._~-]{43,128}$/.test(challenge);
}

export async function validateAuthorizationRequest(
  req: Request
): Promise<ValidatedAuthRequest | { error: string }> {
  const { client_id, redirect_uri, scope, state, code_challenge } = req.query;

  if (!client_id || typeof client_id !== "string") {
    return { error: "missing_client_id" };
  }

  if (!redirect_uri || typeof redirect_uri !== "string") {
    return { error: "missing_redirect_uri" };
  }

  if (!validateRedirectUri(client_id, redirect_uri)) {
    return { error: "invalid_redirect_uri" };
  }

  if (!scope || typeof scope !== "string") {
    return { error: "missing_scope" };
  }

  const requestedScopes = scope.split(" ");
  if (!validateRequestedScopes(requestedScopes)) {
    return { error: "invalid_scope" };
  }

  if (!state || typeof state !== "string" || state.length < 20) {
    return { error: "invalid_state" };
  }

  const codeChallenge =
    typeof code_challenge === "string" ? code_challenge : undefined;
  if (codeChallenge && !validateCodeChallenge(codeChallenge)) {
    return { error:
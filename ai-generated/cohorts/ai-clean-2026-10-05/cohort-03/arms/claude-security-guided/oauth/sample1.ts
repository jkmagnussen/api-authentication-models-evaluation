```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";
import crypto from "crypto";
import url from "url";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

interface AuthorizationRequest {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  state: string;
  code_challenge?: string;
  code_challenge_method?: string;
}

interface StoredAuthCode {
  code: string;
  client_id: string;
  redirect_uri: string;
  scope: string;
  user_id: string;
  expires_at: number;
  code_challenge?: string;
  code_challenge_method?: string;
}

// In-memory storage for demo purposes (use database in production)
const authorizationCodes = new Map<string, StoredAuthCode>();
const registeredClients = new Map<
  string,
  { client_secret: string; redirect_uris: string[] }
>();

// Register a test client
registeredClients.set("test-client", {
  client_secret: crypto.randomBytes(32).toString("hex"),
  redirect_uris: ["http://localhost:3000/callback"],
});

// Constants for security
const AUTH_CODE_EXPIRY_SECONDS = 600; // 10 minutes
const VALID_RESPONSE_TYPES = ["code"];
const VALID_SCOPES = ["openid", "profile", "email"];
const MIN_CODE_CHALLENGE_LENGTH = 43;
const MAX_CODE_CHALLENGE_LENGTH = 128;
const MAX_STATE_LENGTH = 500;
const MAX_REDIRECT_URI_LENGTH = 2000;

// Utility functions
function validateClientId(clientId: string): boolean {
  if (!clientId || typeof clientId !== "string") return false;
  if (clientId.length > 255) return false;
  if (!/^[a-zA-Z0-9\-_.]+$/.test(clientId)) return false;
  return registeredClients.has(clientId);
}

function validateRedirectUri(clientId: string, redirectUri: string): boolean {
  if (!redirectUri || typeof redirectUri !== "string") return false;
  if (redirectUri.length > MAX_REDIRECT_URI_LENGTH) return false;

  try {
    const parsedUrl = new url.URL(redirectUri);
    // Disallow fragment in redirect URI
    if (parsedUrl.hash) return false;
  } catch {
    return false;
  }

  const client = registeredClients.get(clientId);
  if (!client) return false;
  return client.redirect_uris.includes(redirectUri);
}

function validateResponseType(responseType: string): boolean {
  if (!responseType || typeof responseType !== "string") return false;
  return VALID_RESPONSE_TYPES.includes(responseType);
}

function validateScope(scope: string): boolean {
  if (!scope || typeof scope !== "string") return false;
  const scopes = scope.split(" ");
  return scopes.every(
    (s) => VALID_SCOPES.includes(s) && s.length > 0 && s.length < 100
  );
}

function validateState(state: string): boolean {
  if (!state || typeof state !== "string") return false;
  if (state.length > MAX_STATE_LENGTH) return false;
  // State should be alphanumeric and safe characters
  return /^[a-zA-Z0-9\-_.~]+$/.test
```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextlewareFunction } from "express";
import crypto from "crypto";
import url from "url";

const app = express();
app.use(express.json());

// In-memory storage for authorization codes and client configurations
// In production, use a secure database with proper encryption
const authorizationCodes = new Map<
  string,
  { clientId: string; userId: string; expiresAt: number; scopes: string[] }
>();
const registeredClients = new Map<
  string,
  {
    clientSecret: string;
    redirectUris: string[];
    scopes: string[];
    name: string;
  }
>();

// Initialize some test clients
registeredClients.set("test-client-1", {
  clientSecret: crypto.randomBytes(32).toString("hex"),
  redirectUris: ["http://localhost:3001/callback"],
  scopes: ["openid", "profile", "email"],
  name: "Test Client 1",
});

// Constants for secure defaults
const CODE_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutes
const CODE_LENGTH = 128;
const ALLOWED_RESPONSE_TYPES = ["code"];
const REQUIRED_SCOPES = ["openid"];

// Middleware to validate and sanitize input
const validateInput: NextlewareFunction = (req: Request, res: Response, next) => {
  // Sanitize query parameters
  const { client_id, redirect_uri, response_type, scope, state } = req.query;

  // Store validated values
  (req as any).validatedParams = {
    client_id: typeof client_id === "string" ? client_id.trim() : undefined,
    redirect_uri: typeof redirect_uri === "string" ? redirect_uri.trim() : undefined,
    response_type: typeof response_type === "string" ? response_type.trim() : undefined,
    scope: typeof scope === "string" ? scope.trim() : undefined,
    state: typeof state === "string" ? state.trim() : undefined,
  };

  next();
};

// Validate client ID
function validateClientId(clientId: string | undefined): boolean {
  if (!clientId) return false;
  if (typeof clientId !== "string") return false;
  if (clientId.length > 255) return false;
  if (!/^[a-zA-Z0-9\-_]+$/.test(clientId)) return false;
  return registeredClients.has(clientId);
}

// Validate redirect URI
function validateRedirectUri(clientId: string, redirectUri: string | undefined): boolean {
  if (!redirectUri) return false;
  if (typeof redirectUri !== "string") return false;
  if (redirectUri.length > 2048) return false;

  try {
    const parsedUri = new url.URL(redirectUri);
    // Only allow https or http://localhost for development
    if (parsedUri.protocol !== "https:" && parsedUri.hostname !== "localhost") {
      return false;
    }

    const client = registeredClients.get(clientId);
    if (!client) return false;

    return client.redirectUris.includes(redirectUri);
  } catch {
    return false;
  }
}

// Validate response type
function validateResponseType(responseType: string | undefined): boolean {
  if (!responseType) return false;
  return ALLOWED_RESPONSE_TYPES.includes(responseType);
}

// Validate scopes
function validateScopes(requestedScopes: string | undefined): boolean {
  if (!requestedScopes)
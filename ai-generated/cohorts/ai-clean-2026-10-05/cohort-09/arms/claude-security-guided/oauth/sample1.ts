```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextlewareFunction } from "express";
import crypto from "crypto";
import { URL } from "url";

const app = express();
const client = new Anthropic();

// In-memory storage for demo purposes - use secure database in production
const authorizationCodes = new Map<
  string,
  {
    code: string;
    clientId: string;
    redirectUri: string;
    scope: string[];
    expiresAt: number;
    codeChallenge?: string;
  }
>();

const registeredClients = new Map<
  string,
  {
    clientId: string;
    clientSecret: string;
    redirectUris: string[];
    allowedScopes: string[];
  }
>();

// Register a test client
registeredClients.set("test-client", {
  clientId: "test-client",
  clientSecret: crypto.randomBytes(32).toString("hex"),
  redirectUris: ["http://localhost:3001/callback"],
  allowedScopes: ["openid", "profile", "email"],
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Input validation helpers
function validateClientId(clientId: unknown): clientId is string {
  return (
    typeof clientId === "string" && clientId.length > 0 && clientId.length <= 255
  );
}

function validateRedirectUri(uri: unknown): uri is string {
  if (typeof uri !== "string" || uri.length === 0 || uri.length > 2048) {
    return false;
  }
  try {
    const parsed = new URL(uri);
    // Only allow https or http for localhost in development
    return (
      (parsed.protocol === "https:" ||
        (parsed.protocol === "http:" &&
          (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1"))) &&
      !parsed.hash
    );
  } catch {
    return false;
  }
}

function validateScope(scope: unknown): scope is string {
  return (
    typeof scope === "string" &&
    scope.length > 0 &&
    scope.length <= 500 &&
    /^[a-z0-9\s]+$/i.test(scope)
  );
}

function validateCodeChallenge(challenge: unknown): challenge is string {
  if (typeof challenge !== "string") return false;
  // PKCE code challenge should be 43-128 characters, URL-safe base64
  return /^[A-Za-z0-9\-._~]{43,128}$/.test(challenge);
}

function validateResponseType(type: unknown): type is string {
  return type === "code" || type === "id_token" || type === "token";
}

function generateAuthorizationCode(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Secure authorization endpoint
export async function authorizationEndpoint(
  req: Request,
  res: Response
): Promise<void> {
  // Fail closed - reject if any validation fails
  const { client_id, redirect_uri, scope, response_type, code_challenge } =
    req.query;

  // Validate client_id
  if (!validateClientId(client_id)) {
    res.status(400).json({
      error: "invalid_request",
      error_description: "Missing or invalid client_id parameter",
    });
    return;
  }

  // Validate redirect_uri
  if (!validateRedirectUri(redirect_uri))
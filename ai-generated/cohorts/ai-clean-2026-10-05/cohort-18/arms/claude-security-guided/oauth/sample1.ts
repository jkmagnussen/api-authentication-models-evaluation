```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";
import crypto from "crypto";

const app = express();
const client = new Anthropic();

// Secure defaults and configuration
const SECURE_CONFIG = {
  TOKEN_EXPIRY_SECONDS: 3600,
  CODE_EXPIRY_SECONDS: 600,
  MAX_REDIRECT_URI_LENGTH: 2048,
  MAX_CLIENT_ID_LENGTH: 256,
  ALLOWED_RESPONSE_TYPES: ["code", "token"],
  ALLOWED_SCOPES: ["openid", "profile", "email"],
};

// In-memory store for authorization codes and tokens (in production, use secure database)
const authorizationCodes = new Map<
  string,
  {
    clientId: string;
    redirectUri: string;
    scope: string;
    expiresAt: number;
    codeChallenge?: string;
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

// Registered clients (in production, store in secure database)
const registeredClients = new Map<
  string,
  {
    clientSecret: string;
    redirectUris: string[];
  }
>();

// Register a test client
registeredClients.set("test-client-id", {
  clientSecret: "test-client-secret",
  redirectUris: ["http://localhost:3001/callback"],
});

// Utility functions
function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

function validateUrl(url: string): boolean {
  if (url.length > SECURE_CONFIG.MAX_REDIRECT_URI_LENGTH) {
    return false;
  }
  try {
    const parsed = new URL(url);
    // Only allow http and https
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function validateClientId(clientId: string): boolean {
  if (!clientId || clientId.length > SECURE_CONFIG.MAX_CLIENT_ID_LENGTH) {
    return false;
  }
  // Only allow alphanumeric, hyphens, and underscores
  return /^[a-zA-Z0-9_-]+$/.test(clientId);
}

function validateScope(scope: string): boolean {
  if (!scope) return false;
  const requestedScopes = scope.split(" ");
  return requestedScopes.every((s) =>
    SECURE_CONFIG.ALLOWED_SCOPES.includes(s)
  );
}

function validateResponseType(responseType: string): boolean {
  return SECURE_CONFIG.ALLOWED_RESPONSE_TYPES.includes(responseType);
}

function validateCodeChallenge(codeChallenge: string): boolean {
  // Code challenge must be 43-128 characters of unreserved characters
  return /^[A-Za-z0-9\-._~]{43,128}$/.test(codeChallenge);
}

// Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req: Request, res: Response, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Authorization endpoint
export async function handleAuthorizationRequest(
  req: Request,
  res: Response
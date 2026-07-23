```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";

const client = new Anthropic();
const app = express();

// In-memory storage for authorization codes and tokens
const authorizationCodes: Map<string, AuthCodeData> = new Map();
const accessTokens: Map<string, TokenData> = new Map();
const refreshTokens: Map<string, RefreshTokenData> = new Map();

interface AuthCodeData {
  clientId: string;
  userId: string;
  scopes: string[];
  redirectUri: string;
  expiresAt: number;
  codeChallenge?: string;
}

interface TokenData {
  clientId: string;
  userId: string;
  scopes: string[];
  expiresAt: number;
  issuedAt: number;
}

interface RefreshTokenData {
  clientId: string;
  userId: string;
  scopes: string[];
  expiresAt: number;
}

interface ClientConfig {
  secret: string;
  redirectUris: string[];
  allowedScopes: string[];
  tokenLifetime: number;
}

const registeredClients: Map<string, ClientConfig> = new Map([
  [
    "sample_client_1",
    {
      secret: "client_secret_1",
      redirectUris: ["http://localhost:3000/callback"],
      allowedScopes: ["read", "write", "profile"],
      tokenLifetime: 3600,
    },
  ],
  [
    "sample_client_2",
    {
      secret: "client_secret_2",
      redirectUris: ["http://localhost:8080/auth/callback"],
      allowedScopes: ["read", "admin"],
      tokenLifetime: 7200,
    },
  ],
]);

// Helper function to generate random strings
function generateRandomString(length: number = 32): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper to verify PKCE code challenge
function verifyPKCEChallenge(codeVerifier: string, codeChallenge: string): boolean {
  const crypto = require("crypto");
  const hash = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  return hash === codeChallenge;
}

// Authorization endpoint - initiates OAuth2 flow
export const handleAuthorizationRequest = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const {
    client_id,
    redirect_uri,
    response_type,
    scope,
    state,
    code_challenge,
    code_challenge_method,
  } = req.query;

  // Validate client
  if (!registeredClients.has(client_id as string)) {
    res.status(400).json({ error: "invalid_client" });
    return;
  }

  const client = registeredClients
```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextlewareFunction } from "express";
import crypto from "crypto";
import { URL } from "url";

const app = express();
const client = new Anthropic();

// Configuration with secure defaults
const CONFIG = {
  TOKEN_EXPIRY_SECONDS: 3600,
  AUTHORIZATION_CODE_EXPIRY_SECONDS: 600,
  MAX_REDIRECT_URI_LENGTH: 2048,
  ALLOWED_RESPONSE_TYPES: ["code"] as const,
  ALLOWED_GRANT_TYPES: ["authorization_code"] as const,
  REQUIRED_SCOPES: ["openid"] as const,
};

// In-memory storage (in production, use a proper database)
const authorizationCodes = new Map<
  string,
  {
    clientId: string;
    redirectUri: string;
    scope: string;
    userId: string;
    expiresAt: number;
    codeChallenge?: string;
    codeChallengeMethod?: string;
  }
>();

const accessTokens = new Map<
  string,
  {
    clientId: string;
    userId: string;
    scope: string;
    expiresAt: number;
  }
>();

// Registered OAuth clients (in production, query from database)
const registeredClients = new Map<
  string,
  {
    clientSecret: string;
    redirectUris: string[];
    allowedScopes: string[];
  }
>();

// Initialize with a sample client
registeredClients.set("sample-client", {
  clientSecret: crypto.randomBytes(32).toString("hex"),
  redirectUris: ["http://localhost:3001/callback"],
  allowedScopes: ["openid", "profile", "email"],
});

// Utility functions
function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

function validateUrl(url: string, maxLength: number): boolean {
  if (typeof url !== "string" || url.length > maxLength) {
    return false;
  }
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function validateClientId(clientId: string): boolean {
  return (
    typeof clientId === "string" &&
    clientId.length > 0 &&
    clientId.length <= 256 &&
    /^[a-zA-Z0-9._-]+$/.test(clientId)
  );
}

function validateResponseType(responseType: string): boolean {
  return CONFIG.ALLOWED_RESPONSE_TYPES.includes(
    responseType as (typeof CONFIG.ALLOWED_RESPONSE_TYPES)[number]
  );
}

function validateScope(scope: string): boolean {
  if (typeof scope !== "string" || scope.length === 0) {
    return false;
  }
  const scopes = scope.split(" ");
  return scopes.every(
    (s) => s.length > 0 && s.length <= 64 && /^[a-zA-Z0-9._-]+$/.test(s)
  );
}

function validateCodeChallenge(
  codeChallenge: string,
  method: string
): boolean {
  if (!codeChallenge || codeChallenge.length < 43 || codeChallenge.length > 128) {
    return false;
  }
  if (!["plain", "S256"].includes(method)) {
    return false;
  }
  return /^[A-
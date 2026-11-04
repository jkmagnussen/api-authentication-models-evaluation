```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextlewareFunction } from "express";
import crypto from "crypto";
import url from "url";

const app = express();
const client = new Anthropic();

// In-memory store for authorization codes and sessions (use persistent DB in production)
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

const sessions = new Map<
  string,
  {
    clientId: string;
    userId: string;
    scope: string;
    expiresAt: number;
  }
>();

// Registered OAuth clients (in production, use a database)
const registeredClients = new Map<
  string,
  {
    clientSecret: string;
    redirectUris: string[];
    name: string;
  }
>();

// Register test clients
registeredClients.set("test-client-1", {
  clientSecret: crypto.randomBytes(32).toString("hex"),
  redirectUris: [
    "http://localhost:3001/callback",
    "https://example.com/callback",
  ],
  name: "Test Client 1",
});

// Validation constants
const VALID_RESPONSE_TYPES = ["code", "token"];
const VALID_GRANT_TYPES = ["authorization_code", "refresh_token"];
const VALID_SCOPES = ["openid", "profile", "email", "offline_access"];
const MAX_STATE_LENGTH = 500;
const MAX_REDIRECT_URI_LENGTH = 2000;
const CODE_EXPIRY_SECONDS = 600; // 10 minutes
const SESSION_EXPIRY_SECONDS = 3600; // 1 hour
const CODE_LENGTH = 32;

// Utility functions for secure operations
function generateSecureCode(length: number = CODE_LENGTH): string {
  return crypto.randomBytes(length).toString("hex");
}

function validateClientId(clientId: unknown): boolean {
  if (typeof clientId !== "string") return false;
  if (clientId.length === 0 || clientId.length > 100) return false;
  return /^[a-zA-Z0-9\-_]+$/.test(clientId);
}

function validateRedirectUri(redirectUri: unknown): boolean {
  if (typeof redirectUri !== "string") return false;
  if (redirectUri.length === 0 || redirectUri.length > MAX_REDIRECT_URI_LENGTH)
    return false;

  try {
    const parsed = new url.URL(redirectUri);
    // Prevent localhost in production
    if (process.env.NODE_ENV === "production") {
      if (
        parsed.hostname === "localhost" ||
        parsed.hostname === "127.0.0.1"
      ) {
        return false;
      }
    }
    // Require https in production
    if (
      process.env.NODE_ENV === "production" &&
      parsed.protocol !== "https:"
    ) {
      return false;
    }
    // Prevent fragment in redirect URI
    if (parsed.hash) return false;
    return true;
  } catch {
    return false;
  }
}

function validateScope(scope: unknown): boolean {
  if (typeof scope !== "string") return false;
  if (scope.length === 0 || scope.length > 500) return false;

  const scopes = scope.split(" ");
  return scopes.every((s) => VALID_SCOPES.includes(s
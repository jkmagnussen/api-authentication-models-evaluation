```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextlewareFunction } from "express";
import crypto from "crypto";
import url from "url";

const app = express();

// Initialize Anthropic client
const anthropic = new Anthropic();

// Type definitions for OAuth state
interface OAuthState {
  clientId: string;
  redirectUri: string;
  scopes: string[];
  nonce?: string;
  timestamp: number;
  verifier: string;
}

interface ValidatedOAuthRequest {
  clientId: string;
  redirectUri: string;
  scopes: string[];
  nonce?: string;
  state: string;
  responseType: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}

// In-memory storage (use database in production)
const authorizedClients = new Set([
  "trusted-client-123",
  "trusted-client-456",
]);
const validRedirectUris = new Map<string, Set<string>>([
  ["trusted-client-123", new Set(["https://example.com/callback"])],
  ["trusted-client-456", new Set(["https://app.example.com/oauth/callback"])],
]);
const authorizationCodes = new Map<
  string,
  {
    clientId: string;
    redirectUri: string;
    scopes: string[];
    expiresAt: number;
    used: boolean;
  }
>();
const oauthStates = new Map<string, OAuthState>();

// Constants for security
const STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const AUTH_CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const CODE_CHALLENGE_MIN_LENGTH = 43;
const CODE_CHALLENGE_MAX_LENGTH = 128;
const ALLOWED_SCOPES = ["openid", "profile", "email", "offline_access"];
const ALLOWED_RESPONSE_TYPES = ["code", "code id_token"];
const MAX_SCOPES = 10;

// Utility functions
function generateSecureRandom(length: number): string {
  return crypto.randomBytes(length).toString("hex");
}

function validateUrl(urlString: string): boolean {
  try {
    const parsed = new url.URL(urlString);
    return parsed.protocol === "https:" || parsed.hostname === "localhost";
  } catch {
    return false;
  }
}

function validateScope(scope: string): boolean {
  if (!scope || typeof scope !== "string") return false;
  const scopes = scope.split(" ").filter((s) => s.length > 0);
  if (scopes.length === 0 || scopes.length > MAX_SCOPES) return false;
  return scopes.every((s) => ALLOWED_SCOPES.includes(s));
}

function validateCodeChallenge(
  challenge: string,
  method: string
): boolean {
  if (!challenge || typeof challenge !== "string") return false;
  if (challenge.length < CODE_CHALLENGE_MIN_LENGTH || challenge.length > CODE_CHALLENGE_MAX_LENGTH)
    return false;
  if (method && !["plain", "S256"].includes(method)) return false;
  // Validate only alphanumeric, -, ., _, ~
  return /^[A-Za-z0-9\-._~]+$/.test(challenge);
}

function generateAuthorizationCode(
  clientId: string,
  redirectUri: string,
  scopes: string[]
): string {
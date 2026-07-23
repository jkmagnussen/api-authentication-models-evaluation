```typescript
import express, { Router, Request, Response } from "express";
import { randomBytes } from "crypto";

const router = Router();

// Types
interface OAuthSession {
  state: string;
  codeChallenge?: string;
  timestamp: number;
}

interface AuthorizationRequest {
  clientId: string;
  redirectUri: string;
  scope: string[];
  state: string;
  responseType: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}

// In-memory storage (use Redis in production)
const activeSessions = new Map<string, OAuthSession>();
const authorizedClients = new Set([
  "client_app_primary",
  "client_app_secondary",
]);
const validScopes = new Set(["read:user", "write:profile", "email", "openid"]);
const allowedRedirectUris = new Map<string, string[]>([
  ["client_app_primary", ["https://app1.example.com/callback"]],
  ["client_app_secondary", ["https://app2.example.com/callback"]],
]);

// Session cleanup (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

// Helper: Generate secure state token
function generateSecureState(): string {
  return randomBytes(32).toString("hex");
}

// Helper: Validate redirect URI
function validateRedirectUri(clientId: string, redirectUri: string): boolean {
  const allowedUris = allowedRedirectUris.get(clientId);
  if (!allowedUris) return false;
  try {
    const url = new URL(redirectUri);
    return (
      allowedUris.includes(redirectUri) &&
      url.protocol === "https:" &&
      !url.hostname.includes("localhost")
    );
  } catch {
    return false;
  }
}

// Helper: Validate requested scopes
function validateScopes(requestedScopes: string[]): {
  valid: boolean;
  approved: string[];
} {
  const approved = requestedScopes.filter((scope) => validScopes.has(scope));
  return {
    valid: approved.length > 0 && approved.length === requestedScopes.length,
    approved,
  };
}

// Helper: Build authorization response
function buildAuthorizationResponse(
  redirectUri: string,
  code: string,
  state: string
): string {
  const url = new URL(redirectUri);
  url.searchParams.append("code", code);
  url.searchParams.append("state", state);
  return url.toString();
}

// Endpoint: Authorization handler
export async function handleAuthorizationRequest(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Extract and validate query parameters
    const clientId = req.query.client_id as string;
    const redirectUri = req.query.redirect_uri as string;
    const scope = (req.query.scope as string)?.split(" ") || [];
    const state = req.query.state as string;
    const responseType = req.query.response_type as string;
    const codeChallenge = req.query.code_challenge as string;
    const codeChallengeMethod = req.query.code_challenge_method as string;

    // Validate response type
    if (responseType !== "code") {
      res.status(400).json({
        error: "unsupported_response_type",
        error_description: "Only authorization code flow is supported",
      });
      return;
    }

    // Validate client_id
    if (!clientId || !author
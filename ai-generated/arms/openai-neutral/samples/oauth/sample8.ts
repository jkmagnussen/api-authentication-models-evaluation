```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";
import crypto from "crypto";

const client = new Anthropic();

interface AuthRequest {
  clientId: string;
  redirectUri: string;
  scope: string;
  state: string;
  responseType: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}

interface AuthResponse {
  code: string;
  state: string;
  expiresIn: number;
}

interface StoredAuthSession {
  clientId: string;
  redirectUri: string;
  scope: string;
  userId: string;
  timestamp: number;
}

// Configuration
const VALID_CLIENTS = new Map([
  [
    "client_secure_app_001",
    {
      secret: "super_secret_key_12345",
      redirectUris: [
        "http://localhost:3000/callback",
        "https://app.example.com/oauth/callback",
      ],
      allowedScopes: ["openid", "profile", "email", "offline_access"],
      name: "Secure App",
    },
  ],
  [
    "client_web_service_002",
    {
      secret: "another_secret_key_67890",
      redirectUris: ["https://web.example.com/auth/callback"],
      allowedScopes: ["read", "write", "delete"],
      name: "Web Service",
    },
  ],
]);

const VALID_RESPONSE_TYPES = ["code", "id_token", "token"];
const STATE_EXPIRY_MINUTES = 10;
const AUTH_CODE_EXPIRY_MINUTES = 5;

// In-memory storage (replace with database in production)
const authSessions = new Map<string, StoredAuthSession>();
const stateTokens = new Map<string, { expiresAt: number; clientId: string }>();

export function validateRedirectUri(
  clientId: string,
  redirectUri: string
): boolean {
  const clientConfig = VALID_CLIENTS.get(clientId);
  if (!clientConfig) {
    return false;
  }
  return clientConfig.redirectUris.includes(redirectUri);
}

export function validateScopes(clientId: string, scopes: string): boolean {
  const clientConfig = VALID_CLIENTS.get(clientId);
  if (!clientConfig) {
    return false;
  }
  const requestedScopes = scopes.split(" ").filter((s) => s);
  return requestedScopes.every((scope) =>
    clientConfig.allowedScopes.includes(scope)
  );
}

export function generateStateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generateAuthorizationCode(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function validateStateToken(state: string, clientId: string): boolean {
  const tokenData = stateTokens.get(state);
  if (!tokenData) {
    return false;
  }
  if (tokenData.expiresAt < Date.now()) {
    stateTokens.delete(state);
    return false;
  }
  if (tokenData.clientId !== clientId) {
    return false;
  }
  return true;
}

export async function buildAuthorizationEndpoint(
  app: express.Application
) {
  // Authorization endpoint
  app.get("/oauth/authorize", async (req: Request, res: Response) => {
    try {
      const { client_id, redirect_uri, scope, state,
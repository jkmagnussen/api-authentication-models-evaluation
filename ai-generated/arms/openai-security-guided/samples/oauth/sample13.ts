```typescript
import express, { Router, Request, Response } from "express";
import crypto from "crypto";

const router = Router();

interface AuthorizationRequest {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  state: string;
  scope: string;
  nonce?: string;
}

interface ClientConfig {
  client_id: string;
  redirect_uris: string[];
  allowed_scopes: string[];
  client_secret: string;
}

interface AuthorizationState {
  client_id: string;
  redirect_uri: string;
  scope: string;
  nonce?: string;
  created_at: number;
}

const VALID_SCOPES = new Set(["openid", "profile", "email", "offline_access"]);
const STATE_TIMEOUT = 10 * 60 * 1000;
const authorizationCache = new Map<string, AuthorizationState>();

const registeredClients: Map<string, ClientConfig> = new Map([
  [
    "test-client-1",
    {
      client_id: "test-client-1",
      redirect_uris: [
        "https://localhost:3001/callback",
        "http://localhost:3001/callback",
      ],
      allowed_scopes: ["openid", "profile", "email"],
      client_secret: "test-secret-1",
    },
  ],
  [
    "test-client-2",
    {
      client_id: "test-client-2",
      redirect_uris: [
        "https://example.com/auth/callback",
        "https://app.example.com/oauth/callback",
      ],
      allowed_scopes: ["openid", "profile", "email", "offline_access"],
      client_secret: "test-secret-2",
    },
  ],
]);

function validateClientId(clientId: string): ClientConfig | null {
  const config = registeredClients.get(clientId);
  if (!config) {
    return null;
  }
  return config;
}

function validateRedirectUri(clientId: string, redirectUri: string): boolean {
  const client = registeredClients.get(clientId);
  if (!client) {
    return false;
  }

  try {
    const uri = new URL(redirectUri);
    return client.redirect_uris.some((allowed) => allowed === redirectUri);
  } catch {
    return false;
  }
}

function validateScopes(clientId: string, requestedScopes: string): string[] {
  const client = registeredClients.get(clientId);
  if (!client) {
    return [];
  }

  const scopes = requestedScopes.split(" ").filter((s) => s.length > 0);

  const validScopes = scopes.filter((scope) => {
    if (!VALID_SCOPES.has(scope)) {
      return false;
    }
    return client.allowed_scopes.includes(scope);
  });

  return validScopes.length > 0 ? validScopes : [];
}

function generateSecureState(): string {
  return crypto.randomBytes(32).toString("hex");
}

function validateState(state: string): AuthorizationState | null {
  const authState = authorizationCache.get(state);

  if (!authState) {
    return null;
  }

  const age = Date.now() - authState.created_at;
  if (age > STATE_TIMEOUT) {
    authorizationCache.delete(state);
    return null;
  }

  return authState;
}

export const initiate
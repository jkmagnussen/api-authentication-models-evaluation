```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextlewareFunction } from "express";
import crypto from "crypto";
import url from "url";

const client = new Anthropic();

interface OAuth2State {
  clientId: string;
  redirectUri: string;
  scope: string[];
  nonce?: string;
  codeChallenge?: string;
  timestamp: number;
}

interface OAuth2Token {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken?: string;
  idToken?: string;
}

// In-memory storage (use persistent storage in production)
const stateStore = new Map<string, OAuth2State>();
const authorizationCodes = new Map<string, OAuth2State>();
const registeredClients = new Map<
  string,
  { secret: string; redirectUris: string[] }
>();

// Register a test client
registeredClients.set("test-client", {
  secret: "test-client-secret-secure-hash",
  redirectUris: [
    "http://localhost:3001/callback",
    "https://example.com/callback",
  ],
});

export async function validateClientId(clientId: string): Promise<boolean> {
  if (typeof clientId !== "string" || clientId.length === 0) {
    return false;
  }
  if (clientId.length > 128) {
    return false;
  }
  if (!/^[a-zA-Z0-9\-._~]+$/.test(clientId)) {
    return false;
  }
  return registeredClients.has(clientId);
}

export async function validateRedirectUri(
  clientId: string,
  redirectUri: string
): Promise<boolean> {
  if (typeof redirectUri !== "string" || redirectUri.length === 0) {
    return false;
  }
  if (redirectUri.length > 2048) {
    return false;
  }

  try {
    const parsedUrl = new URL(redirectUri);
    if (!["http", "https"].includes(parsedUrl.protocol)) {
      return false;
    }
    if (parsedUrl.hash) {
      return false;
    }
  } catch {
    return false;
  }

  const client = registeredClients.get(clientId);
  if (!client) {
    return false;
  }

  return client.redirectUris.includes(redirectUri);
}

export async function validateScope(scope: string): Promise<string[]> {
  if (typeof scope !== "string") {
    return [];
  }

  const scopes = scope.split(" ").filter((s) => s.length > 0);
  const validScopes = ["openid", "profile", "email", "offline_access"];
  const requestedScopes: string[] = [];

  for (const requestedScope of scopes) {
    if (requestedScope.length > 50) {
      return [];
    }
    if (!/^[a-zA-Z0-9_]+$/.test(requestedScope)) {
      return [];
    }
    if (validScopes.includes(requestedScope)) {
      requestedScopes.push(requestedScope);
    }
  }

  return requestedScopes;
}

export async function validateCodeChallenge(
  codeChallenge: string
): Promise<boolean> {
  if (typeof codeChallenge !== "string") {
    return false;
  }
  if (codeChallenge.length < 43 || codeChallenge.length > 128)
```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextlewareFunction } from "express";

const client = new Anthropic();

// In-memory storage for demo purposes only. Use a database in production.
const authorizationCodes = new Map<
  string,
  {
    code: string;
    clientId: string;
    redirectUri: string;
    scope: string;
    expiresAt: number;
    userId: string;
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

// Pre-register a test client
registeredClients.set("test-client", {
  clientId: "test-client",
  clientSecret: "test-secret-12345",
  redirectUris: ["http://localhost:3001/callback"],
  allowedScopes: ["openid", "profile", "email"],
});

// Secure utility functions
function generateSecureCode(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let code = "";
  for (let i = 0; i < 48; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function validateClientId(clientId: string): boolean {
  if (!clientId || typeof clientId !== "string") {
    return false;
  }
  if (clientId.length > 255) {
    return false;
  }
  // Only allow alphanumeric, dash, underscore
  return /^[a-zA-Z0-9_-]+$/.test(clientId);
}

function validateRedirectUri(redirectUri: string): boolean {
  if (!redirectUri || typeof redirectUri !== "string") {
    return false;
  }
  if (redirectUri.length > 2048) {
    return false;
  }
  if (!isValidUrl(redirectUri)) {
    return false;
  }
  // Ensure HTTPS for production or localhost for testing
  const url = new URL(redirectUri);
  if (url.protocol !== "https:" && url.hostname !== "localhost") {
    return false;
  }
  return true;
}

function validateScope(scope: string): boolean {
  if (!scope || typeof scope !== "string") {
    return false;
  }
  if (scope.length > 500) {
    return false;
  }
  // Validate each scope
  const scopes = scope.split(" ");
  return scopes.every((s) => /^[a-zA-Z0-9._-]+$/.test(s) && s.length > 0);
}

function validateResponseType(responseType: string): boolean {
  // Only support authorization code flow for security
  return responseType === "code";
}

// Middleware for security headers
const securityHeaders: NextlewareFunction = (req: Request, res: Response, next: () => void) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
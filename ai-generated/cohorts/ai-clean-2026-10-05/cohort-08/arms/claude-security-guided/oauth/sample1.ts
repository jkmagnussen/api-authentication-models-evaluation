```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";
import crypto from "crypto";
import querystring from "querystring";

const app = express();
const client = new Anthropic();

// In-memory storage for authorization codes and clients (in production, use a database)
const authorizationCodes = new Map<
  string,
  {
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
    clientSecret: string;
    redirectUris: string[];
    scope: string;
  }
>();

// Register a sample client
registeredClients.set("sample-client", {
  clientSecret: crypto.randomBytes(32).toString("hex"),
  redirectUris: ["http://localhost:3001/callback"],
  scope: "openid profile email",
});

// Validation functions with secure defaults
function validateClientId(clientId: unknown): clientId is string {
  if (typeof clientId !== "string") return false;
  if (clientId.length === 0 || clientId.length > 255) return false;
  if (!/^[a-zA-Z0-9\-_]+$/.test(clientId)) return false;
  return registeredClients.has(clientId);
}

function validateRedirectUri(redirectUri: unknown): redirectUri is string {
  if (typeof redirectUri !== "string") return false;
  if (redirectUri.length === 0 || redirectUri.length > 2048) return false;

  try {
    const url = new URL(redirectUri);
    // Only allow https in production, but allow http for localhost in development
    if (
      url.protocol !== "https:" &&
      !(url.protocol === "http:" && url.hostname === "localhost")
    ) {
      return false;
    }
    // Prevent redirect_uri from containing fragments
    if (url.hash) return false;
    return true;
  } catch {
    return false;
  }
}

function validateScope(scope: unknown): scope is string {
  if (typeof scope !== "string") return false;
  if (scope.length === 0 || scope.length > 255) return false;
  if (!/^[a-zA-Z0-9\s]+$/.test(scope)) return false;
  return true;
}

function validateResponseType(responseType: unknown): responseType is string {
  if (typeof responseType !== "string") return false;
  // Only support authorization code flow
  return responseType === "code";
}

function validateState(state: unknown): state is string {
  if (typeof state !== "string") return false;
  if (state.length === 0 || state.length > 500) return false;
  if (!/^[a-zA-Z0-9\-_.~]+$/.test(state)) return false;
  return true;
}

function validateCodeChallenge(
  codeChallenge: unknown
): codeChallenge is string {
  if (typeof codeChallenge !== "string") return false;
  if (codeChallenge.length === 0 || codeChallenge.length > 128) return false;
  if (!/^[a-zA-Z0-9\-_.~]+$/.test(codeChallenge)) return false;
  return true;
}

// Generate secure authorization code
function generateAuthorizationCode(): string {
  return crypto.randomBytes(32).toString("hex");
}

// OAuth 2.0 Authorization Endpoint
export async
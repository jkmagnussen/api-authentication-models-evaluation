```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";
import crypto from "crypto";

const app = express();
const client = new Anthropic();

// In-memory store for authorization codes (in production, use secure database)
const authorizationCodes = new Map<
  string,
  {
    code: string;
    clientId: string;
    redirectUri: string;
    scope: string[];
    userId: string;
    expiresAt: number;
  }
>();

// In-memory store for registered clients (in production, use secure database)
const registeredClients = new Map<
  string,
  {
    clientId: string;
    clientSecret: string;
    redirectUris: string[];
    allowedScopes: string[];
  }
>();

// Initialize with a sample registered client
registeredClients.set("sample-client", {
  clientId: "sample-client",
  clientSecret: crypto.randomBytes(32).toString("hex"),
  redirectUris: ["http://localhost:3001/callback"],
  allowedScopes: ["openid", "profile", "email"],
});

// Validate and sanitize input
function validateClientId(clientId: unknown): string {
  if (typeof clientId !== "string") {
    throw new Error("Invalid client_id: must be a string");
  }
  if (clientId.length === 0 || clientId.length > 256) {
    throw new Error("Invalid client_id: length must be between 1 and 256");
  }
  if (!/^[a-zA-Z0-9\-_.~]+$/.test(clientId)) {
    throw new Error(
      "Invalid client_id: contains invalid characters. Only alphanumeric, dash, underscore, and tilde allowed"
    );
  }
  return clientId;
}

function validateRedirectUri(redirectUri: unknown): string {
  if (typeof redirectUri !== "string") {
    throw new Error("Invalid redirect_uri: must be a string");
  }
  try {
    const url = new URL(redirectUri);
    // Enforce HTTPS in production, allow HTTP only for localhost
    if (url.protocol !== "https:" && url.hostname !== "localhost") {
      throw new Error("Invalid redirect_uri: must use HTTPS");
    }
    return redirectUri;
  } catch {
    throw new Error("Invalid redirect_uri: must be a valid URL");
  }
}

function validateScope(scope: unknown): string[] {
  if (typeof scope !== "string") {
    throw new Error("Invalid scope: must be a string");
  }
  const scopes = scope.split(" ");
  if (scopes.length === 0) {
    throw new Error("Invalid scope: cannot be empty");
  }
  for (const s of scopes) {
    if (!/^[a-zA-Z0-9\-_.]+$/.test(s)) {
      throw new Error(
        `Invalid scope: '${s}' contains invalid characters. Only alphanumeric, dash, underscore, and dot allowed`
      );
    }
  }
  return scopes;
}

function validateResponseType(responseType: unknown): string {
  if (typeof responseType !== "string") {
    throw new Error("Invalid response_type: must be a string");
  }
  if (responseType !== "code") {
    throw new Error("Invalid response_type: only 'code' is supported");
  }
  return responseType;
}

function generateSecureCode(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

export async function handle
```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";

const client = new Anthropic();

interface ValidationError {
  error: string;
  error_description: string;
}

interface AuthorizationRequest {
  client_id?: string;
  redirect_uri?: string;
  response_type?: string;
  scope?: string;
  state?: string;
}

interface ClientConfig {
  client_id: string;
  client_secret: string;
  redirect_uris: string[];
  scopes: string[];
}

// In-memory client registry (in production, use secure database)
const registeredClients: Map<string, ClientConfig> = new Map([
  [
    "test-client-123",
    {
      client_id: "test-client-123",
      client_secret: "super-secret-key-123",
      redirect_uris: ["http://localhost:3000/callback"],
      scopes: ["openid", "profile", "email"],
    },
  ],
]);

// In-memory authorization code store (in production, use secure database with TTL)
const authorizationCodes: Map<
  string,
  {
    client_id: string;
    user_id: string;
    scope: string;
    redirect_uri: string;
    expires_at: number;
  }
> = new Map();

function validateClientId(clientId: unknown): ValidationError | null {
  if (typeof clientId !== "string" || clientId.trim().length === 0) {
    return {
      error: "invalid_request",
      error_description: "client_id is required and must be a non-empty string",
    };
  }

  if (clientId.length > 255) {
    return {
      error: "invalid_request",
      error_description: "client_id exceeds maximum length",
    };
  }

  if (!/^[a-zA-Z0-9\-_.~]+$/.test(clientId)) {
    return {
      error: "invalid_request",
      error_description: "client_id contains invalid characters",
    };
  }

  return null;
}

function validateRedirectUri(redirectUri: unknown): ValidationError | null {
  if (typeof redirectUri !== "string" || redirectUri.trim().length === 0) {
    return {
      error: "invalid_request",
      error_description:
        "redirect_uri is required and must be a non-empty string",
    };
  }

  try {
    const url = new URL(redirectUri);
    if (!["http", "https"].includes(url.protocol)) {
      return {
        error: "invalid_request",
        error_description: "redirect_uri must use http or https scheme",
      };
    }

    if (url.hash || url.search.includes("code=")) {
      return {
        error: "invalid_request",
        error_description: "redirect_uri must not contain fragment or code",
      };
    }

    return null;
  } catch {
    return {
      error: "invalid_request",
      error_description: "redirect_uri is not a valid URL",
    };
  }
}

function validateResponseType(responseType: unknown): ValidationError | null {
  if (typeof responseType !== "string" || responseType.trim().length === 0) {
    return {
      error: "invalid_request",
      error_description:
        "response_type is required and must be a non-empty string",
    };
  }

  if (responseType !== "code") {
    return {
      error: "unsupported_response_type",
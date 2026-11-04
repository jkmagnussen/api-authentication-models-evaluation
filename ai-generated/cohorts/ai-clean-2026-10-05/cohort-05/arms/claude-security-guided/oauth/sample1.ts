```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextlewareFunction } from "express";
import crypto from "crypto";
import url from "url";

interface AuthorizationRequest {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  state: string;
  code_challenge?: string;
  code_challenge_method?: string;
}

interface StoredAuthorizationCode {
  code: string;
  client_id: string;
  redirect_uri: string;
  scope: string;
  expires_at: number;
  code_challenge?: string;
  code_challenge_method?: string;
  user_id: string;
}

// In-memory storage (should use database in production)
const authorizationCodes = new Map<string, StoredAuthorizationCode>();
const registeredClients = new Map<
  string,
  { redirect_uris: string[]; client_secret: string }
>();
const accessTokens = new Map<
  string,
  { client_id: string; user_id: string; scope: string; expires_at: number }
>();

// Initialize registered clients (in production, load from database)
registeredClients.set("test-client-id", {
  redirect_uris: [
    "http://localhost:3000/callback",
    "https://example.com/callback",
  ],
  client_secret: "test-client-secret",
});

const client = new Anthropic();

export const validateAuthorizationRequest = (
  req: Request
): { valid: boolean; error?: string; request?: AuthorizationRequest } => {
  const { client_id, redirect_uri, response_type, scope, state } = req.query;

  // Fail closed - require all parameters
  if (!client_id || typeof client_id !== "string") {
    return { valid: false, error: "invalid_request: missing client_id" };
  }

  if (!redirect_uri || typeof redirect_uri !== "string") {
    return { valid: false, error: "invalid_request: missing redirect_uri" };
  }

  if (!response_type || typeof response_type !== "string") {
    return { valid: false, error: "invalid_request: missing response_type" };
  }

  if (!scope || typeof scope !== "string") {
    return { valid: false, error: "invalid_request: missing scope" };
  }

  if (!state || typeof state !== "string") {
    return { valid: false, error: "invalid_request: missing state" };
  }

  // Validate response_type
  if (response_type !== "code") {
    return {
      valid: false,
      error: "unsupported_response_type: only authorization_code flow supported",
    };
  }

  // Validate client_id format (alphanumeric and hyphens only)
  if (!/^[a-zA-Z0-9_-]+$/.test(client_id)) {
    return { valid: false, error: "invalid_request: invalid client_id format" };
  }

  // Validate state format (prevent injection attacks)
  if (!/^[a-zA-Z0-9_-]{10,128}$/.test(state)) {
    return { valid: false, error: "invalid_request: invalid state format" };
  }

  // Validate client exists
  if (!registeredClients.has(client_id)) {
    return { valid: false, error: "invalid_client: client not registered" };
  }

  // Validate redirect_uri is registered for this client
  const client_config = regist
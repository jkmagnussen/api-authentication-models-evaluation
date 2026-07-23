```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";
import crypto from "crypto";
import { URL } from "url";

const client = new Anthropic();
const app = express();

// Configuration
const VALID_SCOPES = ["read", "write", "delete"];
const VALID_REDIRECT_DOMAINS = ["localhost:3001", "app.example.com"];
const STATE_CACHE = new Map<string, { createdAt: number; used: boolean }>();
const STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

// Utility functions
function validateRedirectUri(redirectUri: string): boolean {
  try {
    const url = new URL(redirectUri);
    const host = url.hostname + (url.port ? `:${url.port}` : "");

    if (url.protocol !== "https:" && url.hostname !== "localhost") {
      return false;
    }

    return VALID_REDIRECT_DOMAINS.some((domain) => host === domain);
  } catch {
    return false;
  }
}

function validateScopes(requestedScopes: string[]): boolean {
  if (requestedScopes.length === 0) return false;
  return requestedScopes.every((scope) => VALID_SCOPES.includes(scope));
}

function generateState(): string {
  const state = crypto.randomBytes(32).toString("hex");
  STATE_CACHE.set(state, { createdAt: Date.now(), used: false });
  return state;
}

function validateState(state: string): boolean {
  const entry = STATE_CACHE.get(state);

  if (!entry) return false;
  if (entry.used) return false;

  const age = Date.now() - entry.createdAt;
  if (age > STATE_EXPIRY_MS) {
    STATE_CACHE.delete(state);
    return false;
  }

  return true;
}

function markStateUsed(state: string): void {
  const entry = STATE_CACHE.get(state);
  if (entry) {
    entry.used = true;
  }
}

function cleanupExpiredStates(): void {
  const now = Date.now();
  for (const [state, entry] of STATE_CACHE.entries()) {
    if (now - entry.createdAt > STATE_EXPIRY_MS) {
      STATE_CACHE.delete(state);
    }
  }
}

// Express routes
export async function handleAuthorizationRequest(
  req: Request,
  res: Response
): Promise<void> {
  const { client_id, redirect_uri, scope, response_type } = req.query;

  // Validate required parameters
  if (!client_id || !redirect_uri || !scope || !response_type) {
    return res.status(400).json({
      error: "invalid_request",
      error_description: "Missing required parameters",
    });
  }

  // Validate response_type
  if (response_type !== "code") {
    return res.status(400).json({
      error: "unsupported_response_type",
      error_description: "Only authorization code flow is supported",
    });
  }

  // Validate client_id format
  if (typeof client_id !== "string" || client_id.length === 0) {
    return res.status(400).json({
      error: "invalid_request",
      error_description: "Invalid client_id",
    });
  }

  // Validate redirect_uri
  if (typeof redirect_uri !== "string" || !validate
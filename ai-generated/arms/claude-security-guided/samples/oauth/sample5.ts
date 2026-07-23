```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Express, Request, Response } from "express";
import crypto from "crypto";

const client = new Anthropic();
let conversationHistory: { role: string; content: string }[] = [];

export const createOAuth2AuthorizationEndpoint = (): Express => {
  const app = express();

  // Configuration
  const VALID_REDIRECT_URIS = new Set([
    "https://example.com/callback",
    "https://app.example.com/auth/return",
    "http://localhost:3000/callback",
  ]);

  const VALID_SCOPES = new Set([
    "openid",
    "profile",
    "email",
    "offline_access",
    "user:read",
    "user:write",
  ]);

  const STATE_STORE = new Map<string, { expiresAt: number; used: boolean }>();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Helper functions
  const validateRedirectUri = (uri: string): boolean => {
    try {
      const url = new URL(uri);
      // Reject localhost without explicit allowlist
      if (
        url.hostname === "localhost" &&
        !VALID_REDIRECT_URIS.has(uri.split("?")[0])
      ) {
        return false;
      }
      return VALID_REDIRECT_URIS.has(uri.split("?")[0]);
    } catch {
      return false;
    }
  };

  const validateScopes = (scopes: string): boolean => {
    if (!scopes || scopes.trim() === "") {
      return false;
    }
    return scopes.split(" ").every((scope) => VALID_SCOPES.has(scope));
  };

  const generateState = (): string => {
    return crypto.randomBytes(32).toString("hex");
  };

  const validateStateParameter = (state: string): boolean => {
    if (!state || state.length < 32) {
      return false;
    }
    const entry = STATE_STORE.get(state);
    if (!entry) {
      return false;
    }
    if (entry.used) {
      return false;
    }
    if (entry.expiresAt < Date.now()) {
      STATE_STORE.delete(state);
      return false;
    }
    return true;
  };

  const storeState = (state: string): void => {
    STATE_STORE.set(state, {
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      used: false,
    });
  };

  const markStateAsUsed = (state: string): void => {
    const entry = STATE_STORE.get(state);
    if (entry) {
      entry.used = true;
    }
  };

  // Routes
  app.get("/authorize", async (req: Request, res: Response) => {
    const clientId = req.query.client_id as string;
    const redirectUri = req.query.redirect_uri as string;
    const scopes = req.query.scope as string;
    const state = req.query.state as string;
    const responseType = req.query.response_type as string;

    // Validate required parameters
    if (!clientId || !redirectUri || !scopes || !state) {
      return res.status(400).json({
        error: "invalid_request",
        error_description: "Missing required parameters",
      });
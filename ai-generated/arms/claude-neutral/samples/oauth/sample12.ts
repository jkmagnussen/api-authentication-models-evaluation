```typescript
import Anthropic from "@anthropic-ai/sdk";
import express from "express";
import crypto from "crypto";

const app = express();
const client = new Anthropic();

// In-memory storage for demo purposes
const authorizationCodes = new Map<
  string,
  {
    clientId: string;
    redirectUri: string;
    scope: string;
    userId: string;
    expiresAt: number;
  }
>();
const accessTokens = new Map<
  string,
  {
    clientId: string;
    userId: string;
    scope: string;
    expiresAt: number;
  }
>();

const CLIENTS = {
  "demo-client-123": {
    secret: "demo-secret-abc",
    redirectUris: ["http://localhost:3001/callback"],
  },
};

const USERS = {
  "user-001": { email: "user@example.com", name: "Demo User" },
};

export function generateAuthorizationCode(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generateAccessToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function createAuthorizationEndpoint() {
  return (req: express.Request, res: express.Response) => {
    const { client_id, redirect_uri, scope, state, response_type } = req.query;

    if (
      !client_id ||
      !redirect_uri ||
      !scope ||
      !state ||
      response_type !== "code"
    ) {
      return res.status(400).json({
        error: "invalid_request",
        error_description:
          "Missing or invalid parameters for authorization request",
      });
    }

    const clientConfig = CLIENTS[client_id as string];
    if (!clientConfig) {
      return res.status(400).json({
        error: "invalid_client",
        error_description: "Client not recognized",
      });
    }

    if (!clientConfig.redirectUris.includes(redirect_uri as string)) {
      return res.status(400).json({
        error: "invalid_redirect_uri",
        error_description: "Redirect URI not registered for this client",
      });
    }

    // For demo purposes, assume user is authenticated
    const userId = "user-001";

    const authCode = generateAuthorizationCode();
    authorizationCodes.set(authCode, {
      clientId: client_id as string,
      redirectUri: redirect_uri as string,
      scope: scope as string,
      userId,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    const redirectUrl = new URL(redirect_uri as string);
    redirectUrl.searchParams.append("code", authCode);
    redirectUrl.searchParams.append("state", state as string);

    res.redirect(redirectUrl.toString());
  };
}

export function createTokenEndpoint() {
  return (req: express.Request, res: express.Response) => {
    const { code, client_id, client_secret, grant_type, redirect_uri } =
      req.body;

    if (grant_type !== "authorization_code") {
      return res.status(400).json({
        error: "unsupported_grant_type",
        error_description: "Only authorization_code grant type is supported",
      });
    }

    if (!code || !client_id || !client_secret || !redirect_uri) {
      return res.status(400).json({
        error: "invalid_request",
        error_description: "Missing required parameters
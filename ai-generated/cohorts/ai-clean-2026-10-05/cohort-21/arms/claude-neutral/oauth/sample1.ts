```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";
import crypto from "crypto";
import url from "url";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory storage for authorization codes and tokens
const authorizationCodes = new Map<
  string,
  {
    clientId: string;
    redirectUri: string;
    scopes: string[];
    expiresAt: number;
  }
>();
const accessTokens = new Map<
  string,
  {
    clientId: string;
    userId: string;
    scopes: string[];
    expiresAt: number;
  }
>();

// Registered OAuth clients
const registeredClients = new Map(
  Object.entries({
    client123: {
      clientSecret: "secret123",
      redirectUris: ["http://localhost:3001/callback"],
      allowedScopes: ["read", "write", "profile"],
    },
  })
);

// Generate a random token
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// OAuth 2.0 Authorization Endpoint
export async function authorizationEndpoint(
  req: Request,
  res: Response
): Promise<void> {
  const { client_id, redirect_uri, response_type, scope, state } = req.query;

  // Validate client
  if (!registeredClients.has(client_id as string)) {
    res.status(400).json({ error: "invalid_client" });
    return;
  }

  const client = registeredClients.get(client_id as string)!;

  // Validate redirect URI
  if (!client.redirectUris.includes(redirect_uri as string)) {
    res.status(400).json({ error: "invalid_redirect_uri" });
    return;
  }

  // Validate response type
  if (response_type !== "code") {
    const errorUrl = new url.URL(redirect_uri as string);
    errorUrl.searchParams.append("error", "unsupported_response_type");
    if (state) errorUrl.searchParams.append("state", state as string);
    res.redirect(errorUrl.toString());
    return;
  }

  // Validate scopes
  const requestedScopes = (scope as string)?.split(" ") || [];
  const validScopes = requestedScopes.filter((s) =>
    client.allowedScopes.includes(s)
  );

  if (validScopes.length === 0) {
    const errorUrl = new url.URL(redirect_uri as string);
    errorUrl.searchParams.append("error", "invalid_scope");
    if (state) errorUrl.searchParams.append("state", state as string);
    res.redirect(errorUrl.toString());
    return;
  }

  // Generate authorization code
  const authCode = generateToken();
  authorizationCodes.set(authCode, {
    clientId: client_id as string,
    redirectUri: redirect_uri as string,
    scopes: validScopes,
    expiresAt: Date.now() + 600000, // 10 minutes
  });

  // Redirect back to client with authorization code
  const redirectUrl = new url.URL(redirect_uri as string);
  redirectUrl.searchParams.append("code", authCode);
  if (state) redirectUrl.searchParams.append("state", state as string);

  res.redirect(redirectUrl.toString());
}

// OAuth 2.0 Token Endpoint
export async function tokenEnd
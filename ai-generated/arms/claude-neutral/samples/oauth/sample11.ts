```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";
import crypto from "crypto";

const app = express();
app.use(express.json());

interface AuthorizationRequest {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  state: string;
}

interface ClientConfig {
  client_id: string;
  client_secret: string;
  redirect_uris: string[];
}

const registeredClients: Map<string, ClientConfig> = new Map([
  [
    "demo-app-001",
    {
      client_id: "demo-app-001",
      client_secret: "secret-key-demo-app",
      redirect_uris: ["http://localhost:3001/oauth/callback"],
    },
  ],
]);

const authorizationCodes: Map<
  string,
  { client_id: string; expires_at: number; scope: string; user_id: string }
> = new Map();

function generateAuthCode(): string {
  return crypto.randomBytes(32).toString("hex");
}

function validateClientRedirectUri(
  client_id: string,
  redirect_uri: string
): boolean {
  const client = registeredClients.get(client_id);
  return client ? client.redirect_uris.includes(redirect_uri) : false;
}

export async function handleAuthorizationRequest(
  req: Request,
  res: Response
): Promise<void> {
  const {
    client_id,
    redirect_uri,
    response_type,
    scope,
    state,
  }: AuthorizationRequest = req.query as unknown as AuthorizationRequest;

  // Validate required parameters
  if (!client_id || !redirect_uri || !response_type) {
    res.status(400).json({ error: "Missing required parameters" });
    return;
  }

  // Validate client and redirect URI
  if (!validateClientRedirectUri(client_id, redirect_uri)) {
    res.status(400).json({ error: "Invalid client or redirect URI" });
    return;
  }

  // Validate response type
  if (response_type !== "code") {
    const error_uri = `${redirect_uri}?error=unsupported_response_type&state=${state || ""}`;
    res.redirect(error_uri);
    return;
  }

  // Generate authorization code
  const authCode = generateAuthCode();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  authorizationCodes.set(authCode, {
    client_id,
    expires_at: expiresAt,
    scope: scope || "openid profile email",
    user_id: "user-123",
  });

  // Redirect back to client with authorization code
  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.append("code", authCode);
  if (state) {
    redirectUrl.searchParams.append("state", state);
  }

  res.redirect(redirectUrl.toString());
}

export async function handleTokenRequest(
  req: Request,
  res: Response
): Promise<void> {
  const { grant_type, code, client_id, client_secret, redirect_uri } = req.body;

  // Validate grant type
  if (grant_type !== "authorization_code") {
    res.status(400).json({ error: "unsupported_grant_type" });
    return;
  }

  // Validate client credentials
  const client = registered
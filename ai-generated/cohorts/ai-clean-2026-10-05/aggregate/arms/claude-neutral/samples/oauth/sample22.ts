```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";
import crypto from "crypto";

const app = express();
app.use(express.json());

const client = new Anthropic();

interface AuthorizationRequest {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  state: string;
}

interface AuthorizationCode {
  code: string;
  client_id: string;
  redirect_uri: string;
  scope: string;
  expires_at: number;
  user_id?: string;
}

const authorizationCodes = new Map<string, AuthorizationCode>();
const validClients = new Map<string, string>([
  ["client_123", "secret_456"],
  ["test_client", "test_secret"],
]);

function generateAuthorizationCode(): string {
  return crypto.randomBytes(32).toString("hex");
}

export const authorizeHandler = async (req: Request, res: Response) => {
  const {
    client_id,
    redirect_uri,
    response_type,
    scope,
    state,
  } = req.query as Record<string, string>;

  if (!client_id || !redirect_uri || !response_type || !scope || !state) {
    return res.status(400).json({
      error: "invalid_request",
      error_description: "Missing required parameters",
    });
  }

  if (!validClients.has(client_id)) {
    return res.status(401).json({
      error: "invalid_client",
      error_description: "Client ID is not registered",
    });
  }

  if (response_type !== "code") {
    return res.status(400).json({
      error: "unsupported_response_type",
      error_description: "Only authorization_code flow is supported",
    });
  }

  const authorizationCode = generateAuthorizationCode();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  authorizationCodes.set(authorizationCode, {
    code: authorizationCode,
    client_id,
    redirect_uri,
    scope,
    expires_at: expiresAt,
    user_id: "user_123",
  });

  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.append("code", authorizationCode);
  redirectUrl.searchParams.append("state", state);

  res.redirect(redirectUrl.toString());
};

export const tokenHandler = async (req: Request, res: Response) => {
  const { grant_type, code, client_id, client_secret, redirect_uri } =
    req.body;

  if (!grant_type || !code || !client_id || !client_secret || !redirect_uri) {
    return res.status(400).json({
      error: "invalid_request",
      error_description: "Missing required parameters",
    });
  }

  if (grant_type !== "authorization_code") {
    return res.status(400).json({
      error: "unsupported_grant_type",
      error_description: "Only authorization_code grant is supported",
    });
  }

  const expectedSecret = validClients.get(client_id);
  if (!expectedSecret || expectedSecret !== client_secret) {
    return res.status(401).json({
      error: "invalid_client",
      error_description: "Client authentication failed",
    });
  }

  const authCode = authorizationCodes.get(code);
  if (!
```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

const app = express();
const client = new Anthropic();

interface AuthorizationRequest {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  state: string;
}

interface StoredAuthCode {
  code: string;
  client_id: string;
  redirect_uri: string;
  scope: string;
  user_id: string;
  expires_at: number;
}

interface StoredRefreshToken {
  token: string;
  client_id: string;
  user_id: string;
  scope: string;
  created_at: number;
}

// In-memory storage for demo purposes
const authorizationCodes: Map<string, StoredAuthCode> = new Map();
const refreshTokens: Map<string, StoredRefreshToken> = new Map();
const registeredClients: Map<
  string,
  { client_secret: string; redirect_uris: string[] }
> = new Map([
  [
    "test_client_id",
    {
      client_secret: "test_client_secret",
      redirect_uris: [
        "http://localhost:3000/callback",
        "https://example.com/callback",
      ],
    },
  ],
]);

const generateAuthorizationCode = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

const generateAccessToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

const generateRefreshToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const validateAuthorizationRequest = (
  query: Record<string, string | string[] | undefined>
): { valid: boolean; error?: string; request?: AuthorizationRequest } => {
  const client_id = query.client_id as string;
  const redirect_uri = query.redirect_uri as string;
  const response_type = query.response_type as string;
  const scope = (query.scope as string) || "";
  const state = query.state as string;

  if (!client_id || !registeredClients.has(client_id)) {
    return { valid: false, error: "invalid_client" };
  }

  if (!redirect_uri) {
    return { valid: false, error: "invalid_request" };
  }

  const clientConfig = registeredClients.get(client_id);
  if (!clientConfig || !clientConfig.redirect_uris.includes(redirect_uri)) {
    return { valid: false, error: "invalid_grant" };
  }

  if (response_type !== "code") {
    return { valid: false, error: "unsupported_response_type" };
  }

  if (!state) {
    return { valid: false, error: "invalid_request" };
  }

  return {
    valid: true,
    request: {
      client_id,
      redirect_uri,
      response_type,
      scope,
      state,
    },
  };
};

export const authorizeRequest = (
  request: AuthorizationRequest,
  user_id: string
): { code: string; state: string } => {
  const code = generateAuthorizationCode();
  const authCode: StoredAuthCode = {
    code,
    client_id: request.client_id,
    redirect_uri: request.redirect_uri,
    scope: request.
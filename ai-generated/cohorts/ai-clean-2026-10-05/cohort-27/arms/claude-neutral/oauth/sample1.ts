```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";
import crypto from "crypto";

const client = new Anthropic();
const app = express();

// In-memory storage for authorization codes and state
const authorizationCodes = new Map<
  string,
  {
    clientId: string;
    redirectUri: string;
    scope: string;
    expiresAt: number;
  }
>();
const pendingRequests = new Map<
  string,
  {
    clientId: string;
    redirectUri: string;
    scope: string;
    state: string;
  }
>();

// Registered OAuth clients
const registeredClients: Record<
  string,
  { clientSecret: string; redirectUris: string[] }
> = {
  "client-123": {
    clientSecret: "secret-456",
    redirectUris: ["http://localhost:3001/callback"],
  },
};

export const generateAuthorizationCode = (
  clientId: string,
  redirectUri: string,
  scope: string
): string => {
  const code = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  authorizationCodes.set(code, {
    clientId,
    redirectUri,
    scope,
    expiresAt,
  });

  // Clean up expired codes
  for (const [key, value] of authorizationCodes.entries()) {
    if (value.expiresAt < Date.now()) {
      authorizationCodes.delete(key);
    }
  }

  return code;
};

export const generateState = (): string => {
  return crypto.randomBytes(16).toString("hex");
};

export const validateAuthorizationCode = (
  code: string,
  clientId: string,
  redirectUri: string
): boolean => {
  const codeData = authorizationCodes.get(code);

  if (!codeData) return false;
  if (codeData.expiresAt < Date.now()) {
    authorizationCodes.delete(code);
    return false;
  }
  if (codeData.clientId !== clientId || codeData.redirectUri !== redirectUri)
    return false;

  authorizationCodes.delete(code);
  return true;
};

export const authorizationEndpoint = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { client_id, redirect_uri, scope, state, response_type } = req.query;

  // Validate required parameters
  if (!client_id || !redirect_uri || !scope || !state || !response_type) {
    res.status(400).json({
      error: "invalid_request",
      error_description: "Missing required parameters",
    });
    return;
  }

  // Validate client
  if (!registeredClients[client_id as string]) {
    res.status(401).json({
      error: "invalid_client",
      error_description: "Client not found",
    });
    return;
  }

  // Validate redirect URI
  const client = registeredClients[client_id as string];
  if (!client.redirectUris.includes(redirect_uri as string)) {
    res.status(400).json({
      error: "invalid_request",
      error_description: "Invalid redirect URI",
    });
    return;
  }

  // Only support authorization code flow
  if (response_type !== "code") {
    res.status(400).
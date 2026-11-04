```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";
import crypto from "crypto";

const client = new Anthropic();
const app = express();
app.use(express.json());

// In-memory storage for demo purposes
const authorizationCodes = new Map<
  string,
  { clientId: string; redirectUri: string; scope: string; expiresAt: number }
>();
const accessTokens = new Map<
  string,
  { clientId: string; scope: string; expiresAt: number }
>();
const refreshTokens = new Map<
  string,
  { clientId: string; scope: string; expiresAt: number }
>();

// Registered OAuth clients
const registeredClients: Record<
  string,
  { clientSecret: string; redirectUris: string[] }
> = {
  demo_client: {
    clientSecret: "demo_secret_key_12345",
    redirectUris: ["http://localhost:3001/callback"],
  },
};

// Claude conversation history for OAuth flow assistance
let conversationHistory: Array<{
  role: "user" | "assistant";
  content: string;
}> = [];

export async function generateAuthorizationCode(
  clientId: string,
  redirectUri: string,
  scope: string
): Promise<string> {
  const code = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  authorizationCodes.set(code, {
    clientId,
    redirectUri,
    scope,
    expiresAt,
  });

  return code;
}

export function generateAccessToken(
  clientId: string,
  scope: string
): { accessToken: string; refreshToken: string } {
  const accessToken = crypto.randomBytes(32).toString("hex");
  const refreshToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

  accessTokens.set(accessToken, {
    clientId,
    scope,
    expiresAt,
  });

  refreshTokens.set(refreshToken, {
    clientId,
    scope,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return { accessToken, refreshToken };
}

export function verifyAuthorizationCode(
  code: string,
  clientId: string,
  redirectUri: string
): boolean {
  const codeData = authorizationCodes.get(code);

  if (!codeData) return false;
  if (codeData.clientId !== clientId) return false;
  if (codeData.redirectUri !== redirectUri) return false;
  if (codeData.expiresAt < Date.now()) {
    authorizationCodes.delete(code);
    return false;
  }

  authorizationCodes.delete(code);
  return true;
}

export async function getOAuthGuidance(userQuery: string): Promise<string> {
  conversationHistory.push({
    role: "user",
    content: userQuery,
  });

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    system: `You are an OAuth 2.0 expert assistant. Help developers understand and implement OAuth 2.0 flows correctly.
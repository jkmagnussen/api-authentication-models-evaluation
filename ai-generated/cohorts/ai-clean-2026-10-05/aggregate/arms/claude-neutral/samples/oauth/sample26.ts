```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const client = new Anthropic();

interface OAuthClient {
  id: string;
  secret: string;
  redirectUris: string[];
  name: string;
}

interface AuthorizationCode {
  code: string;
  clientId: string;
  userId: string;
  scopes: string[];
  expiresAt: number;
  redirectUri: string;
}

interface AccessToken {
  token: string;
  clientId: string;
  userId: string;
  scopes: string[];
  expiresAt: number;
}

const oauthClients: Map<string, OAuthClient> = new Map([
  [
    "test-client",
    {
      id: "test-client",
      secret: "test-secret-key-12345",
      redirectUris: ["http://localhost:3001/callback"],
      name: "Test OAuth Client",
    },
  ],
]);

const authorizationCodes: Map<string, AuthorizationCode> = new Map();
const accessTokens: Map<string, AccessToken> = new Map();
const conversationHistories: Map<string, Anthropic.MessageParam[]> = new Map();

function generateAuthorizationCode(
  clientId: string,
  userId: string,
  scopes: string[],
  redirectUri: string
): string {
  const code = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 10 * 60 * 1000;

  authorizationCodes.set(code, {
    code,
    clientId,
    userId,
    scopes,
    expiresAt,
    redirectUri,
  });

  return code;
}

function generateAccessToken(
  clientId: string,
  userId: string,
  scopes: string[]
): string {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 60 * 60 * 1000;

  accessTokens.set(token, {
    token,
    clientId,
    userId,
    scopes,
    expiresAt,
  });

  return token;
}

function validateRedirectUri(clientId: string, redirectUri: string): boolean {
  const client = oauthClients.get(clientId);
  if (!client) return false;
  return client.redirectUris.includes(redirectUri);
}

async function processOAuthRequest(userMessage: string): Promise<string> {
  const conversationId = "oauth-assistant";
  if (!conversationHistories.has(conversationId)) {
    conversationHistories.set(conversationId, []);
  }

  const history = conversationHistories.get(conversationId)!;

  history.push({
    role: "user",
    content: userMessage,
  });

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    system: `You are an OAuth 2.0 authorization server assistant. Help process OAuth authorization requests.
    When a user asks about authorization, extract the relevant details (client_id, redirect_uri, scopes, etc.)
    and provide guidance on the OAuth flow. Be concise and technical.`,
    messages: history
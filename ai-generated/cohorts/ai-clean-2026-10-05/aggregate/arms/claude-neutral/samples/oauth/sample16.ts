```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";
import crypto from "crypto";

const app = express();
const client = new Anthropic();

// In-memory stores for demo purposes
const authorizationCodes = new Map<
  string,
  { clientId: string; redirectUri: string; scope: string; expiresAt: number }
>();
const accessTokens = new Map<
  string,
  { clientId: string; userId: string; scope: string; expiresAt: number }
>();
const refreshTokens = new Map<
  string,
  { clientId: string; userId: string; scope: string }
>();

// Registered OAuth clients
const registeredClients = new Map<
  string,
  { clientSecret: string; redirectUris: string[] }
>();

// Register sample clients
registeredClients.set("sample-client-1", {
  clientSecret: "sample-secret-1",
  redirectUris: [
    "http://localhost:3001/callback",
    "http://localhost:8080/oauth/callback",
  ],
});

registeredClients.set("sample-client-2", {
  clientSecret: "sample-secret-2",
  redirectUris: ["https://app.example.com/oauth/callback"],
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

export async function handleAuthorizationRequest(
  req: Request,
  res: Response
): Promise<void> {
  const { client_id, redirect_uri, scope, state, response_type } = req.query;

  // Validate required parameters
  if (!client_id || !redirect_uri || !response_type) {
    res.status(400).json({
      error: "invalid_request",
      error_description: "Missing required parameters",
    });
    return;
  }

  // Validate client_id
  const client = registeredClients.get(client_id as string);
  if (!client) {
    res.status(400).json({
      error: "invalid_client",
      error_description: "Client not found",
    });
    return;
  }

  // Validate redirect_uri
  if (!client.redirectUris.includes(redirect_uri as string)) {
    res.status(400).json({
      error: "invalid_request",
      error_description: "Redirect URI mismatch",
    });
    return;
  }

  // Validate response_type
  if (response_type !== "code") {
    res.status(400).json({
      error: "unsupported_response_type",
      error_description: "Only authorization code flow is supported",
    });
    return;
  }

  // Use Claude to generate a consent prompt message
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `Generate a brief OAuth 2.0 consent message for an application requesting the following scope: "${scope || "default"}". The message should be friendly and explain what permissions are being requested. Keep it under 100 words.`,
      },
    ],
  });

  const consentMessage =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Generate authorization code
  const authCode = crypto.randomBytes(32).toString("hex");
  authorizationCodes.set(authCode, {
    clientId: client_id as string,
    redirectUri: redirect_uri as string,
    scope
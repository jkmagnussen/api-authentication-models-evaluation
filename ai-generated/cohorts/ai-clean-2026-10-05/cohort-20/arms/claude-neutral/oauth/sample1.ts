```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";

const client = new Anthropic();
const app = express();
app.use(express.json());

// In-memory storage for authorization codes and tokens
const authorizationCodes: Map<
  string,
  {
    clientId: string;
    redirectUri: string;
    scope: string;
    expiresAt: number;
    userId: string;
  }
> = new Map();
const accessTokens: Map<
  string,
  {
    clientId: string;
    userId: string;
    scope: string;
    expiresAt: number;
  }
> = new Map();
const refreshTokens: Map<
  string,
  {
    clientId: string;
    userId: string;
    scope: string;
  }
> = new Map();

// Registered OAuth clients
const registeredClients: Map<
  string,
  {
    secret: string;
    redirectUris: string[];
    name: string;
  }
> = new Map([
  [
    "client_123",
    {
      secret: "secret_456",
      redirectUris: [
        "http://localhost:3001/callback",
        "http://localhost:3001/auth/callback",
      ],
      name: "Test Client App",
    },
  ],
]);

// Helper function to generate random tokens
function generateToken(length: number = 32): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Authorization endpoint - displays consent screen and handles authorization
export async function handleAuthorization(
  req: Request,
  res: Response
): Promise<void> {
  const { client_id, redirect_uri, scope, state, response_type } = req.query;

  // Validate required parameters
  if (!client_id || !redirect_uri || !scope || !response_type) {
    res.status(400).json({
      error: "invalid_request",
      error_description: "Missing required parameters",
    });
    return;
  }

  // Validate client
  const client = registeredClients.get(client_id as string);
  if (!client) {
    res.status(400).json({
      error: "invalid_client",
      error_description: "Client not found",
    });
    return;
  }

  // Validate redirect URI
  if (!client.redirectUris.includes(redirect_uri as string)) {
    res.status(400).json({
      error: "invalid_request",
      error_description: "Redirect URI not registered",
    });
    return;
  }

  // Validate response type
  if (response_type !== "code") {
    res.status(400).json({
      error: "unsupported_response_type",
      error_description: "Only authorization code flow is supported",
    });
    return;
  }

  // Use Claude to generate a consent screen message
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Generate a concise OAuth 2.0 consent screen message for an application requesting
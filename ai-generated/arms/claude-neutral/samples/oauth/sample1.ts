```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";
import crypto from "crypto";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory storage for demo purposes
const authorizationCodes = new Map<
  string,
  {
    clientId: string;
    redirectUri: string;
    scope: string;
    expiresAt: number;
  }
>();
const accessTokens = new Map<
  string,
  {
    clientId: string;
    scope: string;
    expiresAt: number;
  }
>();

// Registered OAuth2 clients
const registeredClients = new Map<
  string,
  {
    clientSecret: string;
    redirectUris: string[];
    clientName: string;
  }
>();

registeredClients.set("demo-client-123", {
  clientSecret: "demo-secret-456",
  redirectUris: [
    "http://localhost:3001/callback",
    "https://example.com/callback",
  ],
  clientName: "Demo Application",
});

const client = new Anthropic();

async function analyzeAuthRequest(
  clientId: string,
  requestedScope: string,
  userId: string
): Promise<string> {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 100,
    messages: [
      {
        role: "user",
        content: `Analyze this OAuth2 authorization request and provide a brief security assessment:
Client ID: ${clientId}
Requested Scope: ${requestedScope}
User ID: ${userId}

Provide a one-sentence assessment of whether this request appears legitimate.`,
      },
    ],
  });

  const textContent = message.content.find((block) => block.type === "text");
  return textContent && textContent.type === "text" ? textContent.text : "OK";
}

export const authorize = async (req: Request, res: Response) => {
  const { client_id, redirect_uri, scope, response_type, state } = req.query;

  // Validate request parameters
  if (!client_id || !redirect_uri || !scope) {
    return res.status(400).json({
      error: "invalid_request",
      error_description: "Missing required parameters",
    });
  }

  // Verify client is registered
  const clientConfig = registeredClients.get(client_id as string);
  if (!clientConfig) {
    return res.status(400).json({
      error: "invalid_client",
      error_description: "Client not found",
    });
  }

  // Verify redirect URI
  if (!clientConfig.redirectUris.includes(redirect_uri as string)) {
    return res.status(400).json({
      error: "invalid_request",
      error_description: "Redirect URI not registered",
    });
  }

  if (response_type !== "code") {
    return res.status(400).json({
      error: "unsupported_response_type",
      error_description: "Only code response type is supported",
    });
  }

  try {
    // Use Claude to analyze the authorization request
    const assessment = await analyzeAuthRequest(
      client_id as string,
      scope as string,
      "user-123"
    );
    console.log("Authorization assessment:", assessment);

    // Generate authorization code
    const authCode = crypto.randomBytes(32).toString("hex");
    const expiresAt =
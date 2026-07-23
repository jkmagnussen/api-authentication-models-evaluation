```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";

const app = express();
const client = new Anthropic();

// Store for authorization codes and tokens (in-memory for demo)
const authorizationCodes = new Map<
  string,
  { clientId: string; redirectUri: string; scopes: string[]; expiresAt: number }
>();
const accessTokens = new Map<
  string,
  {
    clientId: string;
    scopes: string[];
    createdAt: number;
    expiresIn: number;
  }
>();

const registeredClients = new Map<
  string,
  { clientSecret: string; redirectUris: string[] }
>();

// Register some sample clients
registeredClients.set("client_001", {
  clientSecret: "secret_001",
  redirectUris: ["http://localhost:3001/callback"],
});
registeredClients.set("client_002", {
  clientSecret: "secret_002",
  redirectUris: ["http://localhost:3002/callback", "https://example.com/auth"],
});

export async function initializeOAuthServer(): Promise<void> {
  const conversationHistory: Array<{ role: string; content: string }> = [];

  // Initial context about OAuth2
  const systemPrompt = `You are an OAuth2 authorization server expert. Help explain OAuth2 flows, token generation, and security best practices. 
Be concise and practical in your responses.`;

  // Have a conversation about OAuth2 implementation
  conversationHistory.push({
    role: "user",
    content:
      "What are the key security considerations for implementing an OAuth2 authorization server?",
  });

  const response = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 300,
    system: systemPrompt,
    messages: conversationHistory as Anthropic.Messages.MessageParam[],
  });

  const assistantMessage =
    response.content[0].type === "text" ? response.content[0].text : "";
  conversationHistory.push({
    role: "assistant",
    content: assistantMessage,
  });

  console.log("OAuth2 Server initialized with security context:");
  console.log(assistantMessage);
  console.log("\n");
}

export function setupAuthorizationEndpoint(app: express.Application): void {
  // Authorization endpoint - step 1 of OAuth2 flow
  app.get("/oauth/authorize", (req: Request, res: Response) => {
    const { client_id, redirect_uri, response_type, scope, state } = req.query;

    // Validate request
    if (!client_id || !redirect_uri || response_type !== "code") {
      return res.status(400).json({
        error: "invalid_request",
        error_description: "Missing required parameters",
      });
    }

    // Check if client is registered
    const clientConfig = registeredClients.get(client_id as string);
    if (!clientConfig) {
      return res.status(401).json({
        error: "unauthorized_client",
        error_description: "Client not registered",
      });
    }

    // Verify redirect URI
    if (!clientConfig.redirectUris.includes(redirect_uri as string)) {
      return res.status(400).json({
        error: "invalid_request",
        error_description: "Redirect URI not registered for this client",
      });
    }

    // Generate authorization code
    const authCode = generateAuthCode();
    const scopeList = (scope as string)?.split("
```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response } from "express";
import crypto from "crypto";
import url from "url";

const app = express();
const client = new Anthropic();

// In-memory storage for authorization codes and sessions
const authorizationCodes: Map<
  string,
  {
    clientId: string;
    redirectUri: string;
    scope: string;
    userId: string;
    expiresAt: number;
  }
> = new Map();

const sessions: Map<
  string,
  {
    clientId: string;
    redirectUri: string;
    scope: string;
    state: string;
    expiresAt: number;
  }
> = new Map();

// Sample registered clients
const registeredClients: Map<
  string,
  {
    secret: string;
    redirectUris: string[];
    name: string;
  }
> = new Map([
  [
    "client123",
    {
      secret: "secret456",
      redirectUris: ["http://localhost:3001/callback"],
      name: "Sample OAuth Client",
    },
  ],
  [
    "client789",
    {
      secret: "secret012",
      redirectUris: ["http://localhost:3002/callback", "https://example.com/oauth/callback"],
      name: "Another OAuth Client",
    },
  ],
]);

// Helper function to generate random strings
function generateRandomString(length: number): string {
  return crypto.randomBytes(length).toString("hex");
}

// Helper function to validate redirect URI
function isValidRedirectUri(clientId: string, redirectUri: string): boolean {
  const client = registeredClients.get(clientId);
  if (!client) return false;
  return client.redirectUris.includes(redirectUri);
}

// Helper function to parse query parameters
function parseQueryString(queryString: string): Record<string, string> {
  const params: Record<string, string> = {};
  const pairs = queryString.split("&");
  for (const pair of pairs) {
    const [key, value] = pair.split("=");
    if (key && value) {
      params[decodeURIComponent(key)] = decodeURIComponent(value);
    }
  }
  return params;
}

// OAuth 2.0 Authorization Endpoint
export async function handleAuthorizationRequest(req: Request, res: Response): Promise<void> {
  try {
    const queryParams = parseQueryString(req.url.split("?")[1] || "");

    const clientId = queryParams.client_id;
    const redirectUri = queryParams.redirect_uri;
    const scope = queryParams.scope || "openid profile email";
    const state = queryParams.state;
    const responseType = queryParams.response_type;

    // Validate required parameters
    if (!clientId || !redirectUri || !responseType) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "invalid_request",
          error_description: "Missing required parameters",
        })
      );
      return;
    }

    // Validate response type
    if (responseType !== "code") {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "unsupported_response_type",
          error_description: "Only 'code' response type is supported",
        })
      );
      return;
    }

    // Validate client
    if (!registeredClients
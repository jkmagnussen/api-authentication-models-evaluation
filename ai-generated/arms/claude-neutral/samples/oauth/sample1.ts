```typescript
import express from "express";
import crypto from "crypto";

interface AuthRequest {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
  state: string;
}

interface AuthGrant {
  code: string;
  client_id: string;
  redirect_uri: string;
  scope: string;
  expires_at: number;
  user_id: string;
}

// In-memory storage for authorization codes and client registrations
const authorizationCodes = new Map<string, AuthGrant>();
const registeredClients = new Map<
  string,
  { client_secret: string; redirect_uris: string[] }
>();

// Register some test clients
registeredClients.set("test-client-1", {
  client_secret: "test-secret-1",
  redirect_uris: ["http://localhost:3001/callback"],
});

registeredClients.set("test-client-2", {
  client_secret: "test-secret-2",
  redirect_uris: ["http://localhost:3002/callback", "https://example.com/auth"],
});

function isValidClient(clientId: string, redirectUri: string): boolean {
  const client = registeredClients.get(clientId);
  if (!client) return false;
  return client.redirect_uris.includes(redirectUri);
}

function generateAuthorizationCode(): string {
  return crypto.randomBytes(32).toString("hex");
}

function validateAuthRequest(params: Record<string, string>): AuthRequest | null {
  const required = ["client_id", "redirect_uri", "response_type", "state"];
  for (const field of required) {
    if (!params[field]) return null;
  }

  if (params.response_type !== "code") return null;
  if (!isValidClient(params.client_id, params.redirect_uri)) return null;

  return {
    client_id: params.client_id,
    redirect_uri: params.redirect_uri,
    response_type: params.response_type,
    scope: params.scope || "openid profile email",
    state: params.state,
  };
}

export function createAuthorizationServer() {
  const app = express();
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  // Authorization endpoint - GET
  app.get("/oauth/authorize", (req, res) => {
    const authRequest = validateAuthRequest(req.query as Record<string, string>);

    if (!authRequest) {
      return res.status(400).json({
        error: "invalid_request",
        error_description: "Invalid authorization request",
      });
    }

    // In a real implementation, this would redirect to a login page
    // For demo purposes, we'll simulate user approval
    const code = generateAuthorizationCode();
    const grant: AuthGrant = {
      code,
      client_id: authRequest.client_id,
      redirect_uri: authRequest.redirect_uri,
      scope: authRequest.scope,
      expires_at: Date.now() + 10 * 60 * 1000, // 10 minutes
      user_id: "demo-user-123",
    };

    authorizationCodes.set(code, grant);

    const redirectUrl = new URL(authRequest.redirect_uri);
    redirectUrl.searchParams.append("code", code);
    redirectUrl.searchParams.append("state", authRequest.state);

    res.redirect(redirectUrl.toString());
  });

  // Token endpoint - POST
  app.post("/oauth/token",
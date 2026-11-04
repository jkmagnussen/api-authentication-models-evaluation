```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextlewareFunction } from "express";
import crypto from "crypto";
import url from "url";

const app = express();
const client = new Anthropic();

// In-memory storage for authorization codes and sessions
// In production, use a secure database
const authorizationCodes = new Map<
  string,
  {
    clientId: string;
    redirectUri: string;
    scopes: string[];
    userId: string;
    expiresAt: number;
    codeChallenge?: string;
  }
>();

const sessions = new Map<
  string,
  {
    clientId: string;
    userId: string;
    scopes: string[];
    createdAt: number;
  }
>();

// Registered OAuth clients (in production, store securely in database)
const registeredClients = new Map<
  string,
  {
    clientSecret: string;
    redirectUris: string[];
    name: string;
  }
>();

// Initialize with a test client
registeredClients.set("test-client", {
  clientSecret: crypto.randomBytes(32).toString("hex"),
  redirectUris: ["http://localhost:3001/callback"],
  name: "Test Client",
});

// Security middleware - validate all inputs
const validateInput: NextlewareFunction = (req: Request, res: Response, next) => {
  // Sanitize and validate query parameters
  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === "string") {
        // Check for suspicious patterns
        if (
          value.length > 2048 ||
          /[<>\"'`]/.test(value) ||
          value.includes("\x00")
        ) {
          return res.status(400).json({ error: "invalid_request" });
        }
      }
    }
  }

  // Validate body if present
  if (req.body && typeof req.body === "object") {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === "string" && value.length > 2048) {
        return res.status(400).json({ error: "invalid_request" });
      }
    }
  }

  next();
};

app.use(express.json({ limit: "1kb" }));
app.use(express.urlencoded({ extended: false, limit: "1kb" }));
app.use(validateInput);

// Helper function to validate redirect URI
function isValidRedirectUri(clientId: string, redirectUri: string): boolean {
  const client = registeredClients.get(clientId);
  if (!client) {
    return false;
  }

  try {
    const parsedUri = url.parse(redirectUri);
    if (!parsedUri.protocol || !parsedUri.host) {
      return false;
    }

    // Only allow https in production (http allowed for localhost testing)
    if (
      parsedUri.protocol !== "https:" &&
      !(parsedUri.hostname === "localhost" || parsedUri.hostname === "127.0.0.1")
    ) {
      return false;
    }

    return client.redirectUris.includes(redirectUri);
  } catch {
    return false;
  }
}

// Helper function to generate secure authorization code
function generateAuthorizationCode(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Helper function to generate session token
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
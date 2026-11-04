```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextlewareFunction } from "express";
import crypto from "crypto";
import { URL } from "url";

const app = express();
const client = new Anthropic();

// In-memory storage for authorization codes and sessions
// In production, use a secure database
const authorizationCodes = new Map<
  string,
  {
    clientId: string;
    redirectUri: string;
    scope: string;
    userId: string;
    expiresAt: number;
  }
>();
const consentSessions = new Map<
  string,
  {
    clientId: string;
    redirectUri: string;
    scope: string;
    expiresAt: number;
  }
>();

// Registered OAuth clients (in production, use a database)
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
  name: "Test Application",
});

// Validation constants
const VALID_RESPONSE_TYPES = ["code"];
const VALID_SCOPES = ["openid", "profile", "email"];
const MAX_SCOPE_LENGTH = 100;
const MAX_CLIENT_ID_LENGTH = 128;
const MAX_REDIRECT_URI_LENGTH = 2048;
const MAX_STATE_LENGTH = 500;
const CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const SESSION_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

// Helper function to validate URLs
function isValidRedirectUri(uri: string): boolean {
  try {
    const parsed = new URL(uri);
    // Reject non-HTTPS in production, allow HTTP for localhost only
    if (
      parsed.protocol !== "https:" &&
      !(parsed.protocol === "http:" && parsed.hostname === "localhost")
    ) {
      return false;
    }
    // Reject URIs with fragments
    if (parsed.hash) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Helper function to validate scope
function isValidScope(scope: string): boolean {
  if (!scope || scope.length > MAX_SCOPE_LENGTH) {
    return false;
  }
  const scopes = scope.split(" ");
  return scopes.every((s) => VALID_SCOPES.includes(s));
}

// Helper function to generate secure random code
function generateAuthCode(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Middleware to validate content-type for POST requests
const validateContentType: NextlewareFunction = (req, res, next) => {
  if (req.method === "POST") {
    const contentType = req.get("content-type");
    if (!contentType || !contentType.includes("application/x-www-form-urlencoded")) {
      return res.status(400).json({
        error: "invalid_request",
        error_description: "Invalid Content-Type header",
      });
    }
  }
  next();
};

// Middleware to parse form data
app.use(express.urlencoded({ extended: false }));
app.use(validateContentType);

// Health check endpoint
export async function healthCheck(req: Request, res: Response): Promise
```typescript
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import { Anthropic } from "@anthropic-ai/sdk";

// Secure session configuration with strict defaults
const sessionConfig = {
  secret: process.env.SESSION_SECRET || generateSecureSecret(),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    httpOnly: true, // Prevents client-side JS access
    sameSite: "strict" as const, // CSRF protection
    maxAge: 15 * 60 * 1000, // 15 minutes
  },
  name: "sessionId", // Non-default name for security
};

// Generate a cryptographically secure random secret
function generateSecureSecret(): string {
  const crypto = require("crypto");
  return crypto.randomBytes(32).toString("hex");
}

// Validate session input with strict rules
function validateSessionInput(input: unknown): boolean {
  if (typeof input !== "string") {
    return false;
  }

  // Max length check - prevent buffer overflow attacks
  if (input.length > 1000) {
    return false;
  }

  // Only allow alphanumeric, spaces, and basic punctuation
  const sanitized = /^[a-zA-Z0-9\s\.\,\!\?\-\'\"]*$/.test(input);
  if (!sanitized) {
    return false;
  }

  return true;
}

// Middleware to validate and sanitize user input
export function validateInputMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Validate query parameters
  for (const [key, value] of Object.entries(req.query)) {
    if (!validateSessionInput(String(value))) {
      res.status(400).json({ error: "Invalid input detected" });
      return;
    }
  }

  // Validate body parameters if present
  if (req.body && typeof req.body === "object") {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === "string" && !validateSessionInput(value)) {
        res.status(400).json({ error: "Invalid input detected" });
        return;
      }
    }
  }

  next();
}

// Middleware to ensure user is authenticated
export function requireAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.session.userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}

// Initialize and configure Express app
export function createApp(): express.Application {
  const app = express();

  // Apply session middleware
  app.use(session(sessionConfig));

  // Parse JSON bodies
  app.use(express.json());

  // Apply input validation middleware to all routes
  app.use(validateInputMiddleware);

  // Initialize Anthropic client for chat functionality
  const client = new Anthropic();

  // Health check endpoint
  app.get("/health", (req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Login endpoint - creates a session
  app.post("/login", async (req: Request, res: Response) => {
    const { username, password } = req.body;

    // Fail closed - strict validation
    if (!validateSessionInput(username) || !validateSessionInput(password)) {
      res.status(400
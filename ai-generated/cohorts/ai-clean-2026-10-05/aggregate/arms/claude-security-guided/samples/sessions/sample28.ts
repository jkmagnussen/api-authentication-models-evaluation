```typescript
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import { randomBytes } from "crypto";

// Session configuration with secure defaults
const SESSION_CONFIG = {
  secret: process.env.SESSION_SECRET || randomBytes(32).toString("hex"),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "strict" as const,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
  },
  name: "sessionId",
  genid: () => randomBytes(16).toString("hex"),
};

// Types for validated session data
interface ValidatedUser {
  id: string;
  email: string;
  role: "admin" | "user";
}

interface SessionData {
  user?: ValidatedUser;
}

declare global {
  namespace Express {
    interface Request {
      session: session.Session & Partial<SessionData>;
    }
  }
}

// Input validation utilities
function validateEmail(email: unknown): email is string {
  if (typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

function validateUserId(id: unknown): id is string {
  if (typeof id !== "string") return false;
  return /^[a-zA-Z0-9_-]{1,64}$/.test(id);
}

function validateRole(role: unknown): role is "admin" | "user" {
  return role === "admin" || role === "user";
}

function validateUser(user: unknown): user is ValidatedUser {
  if (typeof user !== "object" || user === null) return false;
  const u = user as Record<string, unknown>;

  return (
    validateUserId(u.id) &&
    validateEmail(u.email) &&
    validateRole(u.role)
  );
}

// Session management functions
export function initializeSessionMiddleware(app: express.Application): void {
  app.use(session(SESSION_CONFIG));
}

export function createSessionValidator() {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Validate session exists and has proper structure
    if (!req.session) {
      res.status(500).json({ error: "Session initialization failed" });
      return;
    }

    // Validate session ID format
    if (req.sessionID && !/^[a-f0-9]{32}$/.test(req.sessionID)) {
      res.status(400).json({ error: "Invalid session" });
      return;
    }

    // Validate user data if present
    if (req.session.user && !validateUser(req.session.user)) {
      delete req.session.user;
      res.status(400).json({ error: "Session data validation failed" });
      return;
    }

    next();
  };
}

export function requireAuthentication(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.session.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  next();
}

export function requireRole(role: "admin" | "user") {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session.user) {
      res.status(
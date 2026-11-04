```typescript
import express, { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import StoreModule from "connect-mongo";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import rateLimit from "express-rate-limit";

// Secure session configuration with strict defaults
const SESSION_CONFIG = {
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "strict" as const,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    domain:
      process.env.NODE_ENV === "production"
        ? process.env.COOKIE_DOMAIN
        : undefined,
  },
  name: "sessionId",
  genid: () => uuidv4(),
};

// Rate limiting for session operations
const sessionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many session operations, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

// Session validation middleware
export const validateSessionInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Validate session ID format
  if (req.sessionID && !isValidSessionId(req.sessionID)) {
    res.status(400).json({ error: "Invalid session format" });
    return;
  }

  // Validate session data doesn't exceed size limits
  const sessionSize = JSON.stringify(req.session).length;
  if (sessionSize > 10000) {
    // 10KB limit
    res.status(413).json({ error: "Session data too large" });
    return;
  }

  next();
};

// Session ID validation function
function isValidSessionId(sessionId: string): boolean {
  // UUID v4 format validation
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(sessionId) && sessionId.length === 36;
}

// User authentication type
interface User {
  id: string;
  email: string;
  role: "user" | "admin";
  loginTime: number;
}

// Extend Express Session with custom properties
declare global {
  namespace Express {
    interface Session {
      user?: User;
      csrfToken?: string;
      loginAttempts?: number;
      lastActivity?: number;
    }
  }
}

// CSRF token generation and validation
export const generateCsrfToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const validateCsrfToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS") {
    const token = req.body.csrfToken || req.headers["x-csrf-token"];

    if (!token || !req.session.csrfToken) {
      res.status(403).json({ error: "
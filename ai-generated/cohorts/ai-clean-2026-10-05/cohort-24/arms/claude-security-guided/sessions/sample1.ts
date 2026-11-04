```typescript
import express, { Express, Request, Response, NextFunction } from "express";
import session, { SessionOptions } from "express-session";
import { randomBytes } from "crypto";

// Secure session configuration with defaults
const getSecureSessionConfig = (): SessionOptions => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    secret: process.env.SESSION_SECRET || randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction, // HTTPS only in production
      httpOnly: true, // Prevent client-side JS access
      sameSite: "strict", // CSRF protection
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
    name: "sessionId", // Custom session cookie name
  };
};

// Type definitions for session data
interface AuthenticatedSessionData {
  userId?: string;
  username?: string;
  role?: string;
  loginTime?: number;
}

declare global {
  namespace Express {
    interface Session extends AuthenticatedSessionData {}
  }
}

// Input validation utilities with fail-closed approach
const validateUserId = (userId: unknown): string => {
  if (typeof userId !== "string") {
    throw new Error("Invalid userId: must be a string");
  }

  if (userId.length === 0 || userId.length > 50) {
    throw new Error("Invalid userId: length must be between 1 and 50");
  }

  // Only allow alphanumeric, underscore, and hyphen
  if (!/^[a-zA-Z0-9_-]+$/.test(userId)) {
    throw new Error("Invalid userId: contains invalid characters");
  }

  return userId;
};

const validateUsername = (username: unknown): string => {
  if (typeof username !== "string") {
    throw new Error("Invalid username: must be a string");
  }

  if (username.length < 3 || username.length > 30) {
    throw new Error("Invalid username: length must be between 3 and 30");
  }

  // Only allow alphanumeric, underscore, hyphen, and period
  if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
    throw new Error("Invalid username: contains invalid characters");
  }

  return username;
};

const validateRole = (role: unknown): string => {
  const validRoles = ["user", "admin", "moderator"];

  if (typeof role !== "string") {
    throw new Error("Invalid role: must be a string");
  }

  if (!validRoles.includes(role)) {
    throw new Error(`Invalid role: must be one of ${validRoles.join(", ")}`);
  }

  return role;
};

// Session management functions
export const initializeSessionMiddleware = (app: Express): void => {
  const sessionConfig = getSecureSessionConfig();
  app.use(session(sessionConfig));
};

export const loginUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { userId, username, role } = req.body;

    // Validate all inputs - fail closed on validation error
    const validatedUserId = validateUserId(userId);
    const validatedUsername = validateUsername(username);
    const validatedRole = validateRole(role);

    // Store validated data in session
    req.session.userId = validatedUserId;
    req.session.username = validatedUsername;
    req.session.role = validatedRole;
    req.session
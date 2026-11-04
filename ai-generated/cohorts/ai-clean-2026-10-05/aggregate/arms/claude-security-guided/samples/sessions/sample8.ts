```typescript
import express, { Express, Request, Response, NextFunction } from "express";
import session, { SessionOptions } from "express-session";
import crypto from "crypto";

// Session data interface with strict typing
interface SessionData extends Express.Session {
  userId?: string;
  username?: string;
  role?: string;
  loginTime?: number;
  lastActivity?: number;
}

// Validation rules for session data
const SESSION_VALIDATION_RULES = {
  userId: {
    pattern: /^[a-f0-9]{24}$/,
    maxLength: 24,
    required: false,
  },
  username: {
    pattern: /^[a-zA-Z0-9_-]{3,32}$/,
    maxLength: 32,
    required: false,
  },
  role: {
    allowedValues: ["user", "admin", "moderator"],
    required: false,
  },
} as const;

// Session timeout constants (in milliseconds)
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const ABSOLUTE_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
const ACTIVITY_CHECK_INTERVAL = 60 * 1000; // 1 minute

// Secure session configuration
const createSecureSessionConfig = (): SessionOptions => {
  return {
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
    name: "sessionId",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "strict",
      maxAge: SESSION_TIMEOUT,
      domain: process.env.SESSION_DOMAIN,
    },
    rolling: true,
  };
};

// Validation function for session data
export const validateSessionData = (
  data: Partial<SessionData>
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (data.userId !== undefined) {
    if (typeof data.userId !== "string") {
      errors.push("userId must be a string");
    } else if (!SESSION_VALIDATION_RULES.userId.pattern.test(data.userId)) {
      errors.push("userId format is invalid");
    }
  }

  if (data.username !== undefined) {
    if (typeof data.username !== "string") {
      errors.push("username must be a string");
    } else if (data.username.length > SESSION_VALIDATION_RULES.username.maxLength) {
      errors.push(`username exceeds maximum length of ${SESSION_VALIDATION_RULES.username.maxLength}`);
    } else if (!SESSION_VALIDATION_RULES.username.pattern.test(data.username)) {
      errors.push("username format is invalid");
    }
  }

  if (data.role !== undefined) {
    if (typeof data.role !== "string") {
      errors.push("role must be a string");
    } else if (
      !SESSION_VALIDATION_RULES.role.allowedValues.includes(
        data.role as (typeof SESSION_VALIDATION_RULES.role.allowedValues)[number]
      )
    ) {
      errors.push("role is not allowed");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// Session timeout middleware
export const sessionTimeoutMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const session = req
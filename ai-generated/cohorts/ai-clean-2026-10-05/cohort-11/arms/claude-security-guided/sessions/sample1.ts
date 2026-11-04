```typescript
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import { v4 as uuidv4 } from "uuid";

// Session validation schema
interface SessionData {
  userId?: string;
  username?: string;
  role?: string;
  loginTime?: number;
  lastActivity?: number;
}

// Validation constants - secure defaults
const SESSION_CONFIG = {
  SECRET: process.env.SESSION_SECRET || uuidv4(), // Generate random if not provided
  MAX_AGE: 1000 * 60 * 30, // 30 minutes
  IDLE_TIMEOUT: 1000 * 60 * 15, // 15 minutes of inactivity
  SECURE: process.env.NODE_ENV === "production", // HTTPS only in production
  HTTP_ONLY: true, // Prevent JavaScript access to session cookie
  SAME_SITE: "strict" as const, // CSRF protection
  REGENERATE_ON_LOGIN: true,
};

// Input validation helper
export function validateSessionInput(data: unknown): SessionData | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const input = data as Record<string, unknown>;
  const validated: SessionData = {};

  // Validate userId - alphanumeric only, max 50 chars
  if (input.userId !== undefined) {
    if (
      typeof input.userId === "string" &&
      /^[a-zA-Z0-9_-]{1,50}$/.test(input.userId)
    ) {
      validated.userId = input.userId;
    } else {
      // Fail closed - invalid userId means reject entire input
      return null;
    }
  }

  // Validate username - alphanumeric and underscores, max 30 chars
  if (input.username !== undefined) {
    if (
      typeof input.username === "string" &&
      /^[a-zA-Z0-9_]{1,30}$/.test(input.username)
    ) {
      validated.username = input.username;
    } else {
      return null;
    }
  }

  // Validate role - only allow predefined roles
  if (input.role !== undefined) {
    const allowedRoles = ["user", "admin", "moderator"];
    if (typeof input.role === "string" && allowedRoles.includes(input.role)) {
      validated.role = input.role;
    } else {
      return null;
    }
  }

  // Validate timestamps - must be numbers and reasonable
  if (input.loginTime !== undefined) {
    if (typeof input.loginTime === "number" && input.loginTime > 0) {
      validated.loginTime = input.loginTime;
    } else {
      return null;
    }
  }

  if (input.lastActivity !== undefined) {
    if (typeof input.lastActivity === "number" && input.lastActivity > 0) {
      validated.lastActivity = input.lastActivity;
    } else {
      return null;
    }
  }

  return validated;
}

// Session activity tracker middleware
export function sessionActivityMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.session) {
    const now = Date.now();

    // Check for session timeout
    if (req.session.lastActivity) {
      const inactivityTime = now - req.session.lastActivity;
      if (inactivityTime > SESSION_CONFIG.IDLE_TIMEOUT) {
        req.session.destroy((err) => {
          if (err) {
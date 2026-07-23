```typescript
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import { randomBytes } from "crypto";

// Extend Express session types
declare global {
  namespace Express {
    interface Session {
      userId?: string;
      regeneratedAt?: number;
    }
  }
}

// Configuration constants
const SESSION_SECRET = process.env.SESSION_SECRET || randomBytes(32).toString("hex");
const SESSION_MAX_AGE = 30 * 60 * 1000; // 30 minutes
const SECURE_COOKIE_FLAGS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: SESSION_MAX_AGE,
};

// Initialize session middleware
export const configureSessionMiddleware = () => {
  return session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: SECURE_COOKIE_FLAGS,
    name: "secureSessionId",
  });
};

// Regenerate session for privilege escalation
export const regenerateSession = (
  req: Request,
  res: Response,
  callback?: (err?: Error) => void
): void => {
  const oldSessionId = req.sessionID;

  req.session.regenerate((err) => {
    if (err) {
      console.error("Session regeneration failed:", err);
      if (callback) callback(err);
      return;
    }

    // Track regeneration timestamp
    req.session.regeneratedAt = Date.now();

    // Optionally clear old session data
    req.sessionStore?.destroy(oldSessionId, (destroyErr) => {
      if (destroyErr && destroyErr.code !== "ENOENT") {
        console.warn("Failed to destroy old session:", destroyErr);
      }
      if (callback) callback();
    });
  });
};

// Authenticate user and establish session
export const authenticateAndCreateSession = (
  req: Request,
  userId: string,
  callback?: (err?: Error) => void
): void => {
  regenerateSession(req, new Response(), (err) => {
    if (err) {
      console.error("Authentication session creation failed:", err);
      if (callback) callback(err);
      return;
    }

    req.session.userId = userId;
    req.session.save((saveErr) => {
      if (saveErr) {
        console.error("Session save failed:", saveErr);
        if (callback) callback(saveErr);
        return;
      }

      if (callback) callback();
    });
  });
};

// Validate active session
export const validateActiveSession = (req: Request): boolean => {
  if (!req.session) {
    return false;
  }

  const isAuthenticated = Boolean(req.session.userId);
  const sessionAge = Date.now() - (req.session.regeneratedAt || req.session.cookie._expires || 0);

  // Enforce maximum session lifetime (e.g., 8 hours)
  const MAX_SESSION_LIFETIME = 8 * 60 * 60 * 1000;
  if (sessionAge > MAX_SESSION_LIFETIME) {
    return false;
  }

  return isAuthenticated;
};

// Comprehensive logout with session destruction
export const invalidateSessionAndLogout = (
  req: Request,
  res: Response,
  callback?: (err?: Error) => void
): void => {
  if (!req.session) {
    if (callback) callback();
    return;
  }

  // Clear session data
  req
```typescript
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import crypto from "crypto";
import { z } from "zod";

// Constants for security configuration
const SESSION_SECRET =
  process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const SECURE_COOKIE_OPTIONS = {
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
  sameSite: "strict" as const,
  maxAge: SESSION_TIMEOUT,
};

// Validation schemas
const userDataSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  username: z.string().min(3).max(50),
  roles: z.array(z.string()).default([]),
});

const loginCredentialsSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8),
});

// Types
interface AuthenticatedUser {
  userId: string;
  email: string;
  username: string;
  roles: string[];
}

interface SessionData {
  user?: AuthenticatedUser;
  loginAttempts?: number;
  lastLoginAttempt?: number;
}

// Extend Express Session to include our custom data
declare global {
  namespace Express {
    interface Session {
      user?: AuthenticatedUser;
      loginAttempts?: number;
      lastLoginAttempt?: number;
    }
  }
}

// Session management functions
export function initializeSessionMiddleware(app: express.Application): void {
  app.use(
    session({
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: SECURE_COOKIE_OPTIONS,
      name: "sessionId",
      genid: () => crypto.randomBytes(16).toString("hex"),
    })
  );
}

export function validateUserData(
  userData: unknown
): AuthenticatedUser | null {
  try {
    return userDataSchema.parse(userData);
  } catch (error) {
    console.error("User data validation failed:", error);
    return null;
  }
}

export function validateLoginCredentials(
  credentials: unknown
): { username: string; password: string } | null {
  try {
    return loginCredentialsSchema.parse(credentials);
  } catch (error) {
    console.error("Login credentials validation failed:", error);
    return null;
  }
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.session.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  // Validate session data integrity
  const validatedUser = validateUserData(req.session.user);
  if (!validatedUser) {
    req.session.destroy((err) => {
      if (err) console.error("Session destruction error:", err);
    });
    res.status(401).json({ error: "Invalid session" });
    return;
  }

  next();
}

export function requireRole(
  requiredRoles: string[]
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const userRoles
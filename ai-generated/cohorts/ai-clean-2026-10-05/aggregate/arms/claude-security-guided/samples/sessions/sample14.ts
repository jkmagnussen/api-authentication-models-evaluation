```typescript
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import crypto from "crypto";

// Secure session configuration with defaults
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
const SESSION_MAX_AGE = parseInt(process.env.SESSION_MAX_AGE || "3600000", 10); // 1 hour default
const SESSION_NAME = "sessionId";
const SECURE_COOKIE = process.env.NODE_ENV === "production";

// Session data validation schema
interface SessionUser {
  id: string;
  email: string;
  role: string;
  loginTime: number;
}

// Validation functions with fail-closed approach
export const validateSessionUser = (data: unknown): SessionUser | null => {
  if (!data || typeof data !== "object") {
    return null;
  }

  const obj = data as Record<string, unknown>;

  // Strict validation - fail if any required field is missing or invalid
  if (typeof obj.id !== "string" || obj.id.length === 0 || obj.id.length > 255) {
    return null;
  }

  if (typeof obj.email !== "string" || !obj.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return null;
  }

  if (typeof obj.role !== "string" || !["user", "admin", "moderator"].includes(obj.role)) {
    return null;
  }

  if (typeof obj.loginTime !== "number" || obj.loginTime <= 0) {
    return null;
  }

  return {
    id: obj.id,
    email: obj.email,
    role: obj.role,
    loginTime: obj.loginTime,
  };
};

export const validateSessionTimeout = (loginTime: number, maxAge: number): boolean => {
  const currentTime = Date.now();
  return currentTime - loginTime < maxAge;
};

// Session middleware setup
export const configureSessionMiddleware = (app: express.Application): void => {
  app.use(
    session({
      secret: SESSION_SECRET,
      name: SESSION_NAME,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: SECURE_COOKIE,
        httpOnly: true,
        sameSite: "strict",
        maxAge: SESSION_MAX_AGE,
        path: "/",
      },
    })
  );
};

// Authentication middleware with validation
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  // Validate session existence
  if (!req.session) {
    res.status(401).json({ error: "Session not initialized" });
    return;
  }

  // Validate user data in session
  const user = validateSessionUser(req.session.user);
  if (!user) {
    // Destroy invalid session - fail closed
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
      }
      res.status(401).json({ error: "Invalid session data" });
    });
    return;
  }

  // Validate session timeout
  if (!validateSessionTimeout(user.loginTime, SESSION_MAX_AGE)) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
      }
      res.status(401).json({ error: "Session expired" });
    });
    return;
  }

  // Session is valid
  next();
};
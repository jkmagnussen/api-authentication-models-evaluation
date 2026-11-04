```typescript
import express, { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import crypto from "crypto";

// Secure session configuration with safe defaults
const getSessionConfig = () => ({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
  resave: false, // Don't save unmodified sessions
  saveUninitialized: false, // Don't create sessions until something is stored
  cookie: {
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    httpOnly: true, // Prevent client-side JS from accessing the session cookie
    sameSite: "strict" as const, // CSRF protection
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
  },
  name: "sessionId", // Use non-default session cookie name
});

// Validation utilities for untrusted input
const validateEmail = (email: string): boolean => {
  if (typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

const validateUsername = (username: string): boolean => {
  if (typeof username !== "string") return false;
  // Alphanumeric, underscore, hyphen, 3-20 chars
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
};

const validatePassword = (password: string): boolean => {
  if (typeof password !== "string") return false;
  // At least 8 chars, uppercase, lowercase, number, special char
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// User session data interface
interface UserSession {
  userId: string;
  username: string;
  email: string;
  loginTime: number;
  lastActivity: number;
}

// Extend Express Session to include custom user data
declare global {
  namespace Express {
    interface Session {
      user?: UserSession;
      csrf?: string;
    }
  }
}

// Authentication middleware with secure defaults
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.session.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Check session timeout (30 min inactivity)
  const now = Date.now();
  const lastActivity = req.session.user.lastActivity || now;
  if (now - lastActivity > 1000 * 60 * 30) {
    req.session.destroy(() => {
      res.status(401).json({ error: "Session expired" });
    });
    return;
  }

  // Update last activity
  req.session.user.lastActivity = now;
  next();
};

// CSRF protection middleware
export const validateCSRF = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS") {
    const csrfToken = req.headers["x-csrf-token"];
    if (!csrfToken || cs
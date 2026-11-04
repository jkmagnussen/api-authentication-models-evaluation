```typescript
import express, { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import crypto from "crypto";

// Type definitions for secure session data
interface SessionData extends session.SessionData {
  userId?: string;
  username?: string;
  isAuthenticated?: boolean;
  loginTimestamp?: number;
  ipAddress?: string;
}

// Configuration constants with secure defaults
const SESSION_CONFIG = {
  SECRET: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
  MAX_AGE: parseInt(process.env.SESSION_MAX_AGE || "3600000"), // 1 hour default
  SECURE: process.env.NODE_ENV === "production",
  HTTP_ONLY: true,
  SAME_SITE: "strict" as const,
  REGENERATE_INTERVAL: 300000, // 5 minutes
};

// Input validation helper
export function validateInput(
  input: unknown,
  maxLength: number = 256
): string | null {
  if (typeof input !== "string") {
    return null;
  }

  const trimmed = input.trim();

  if (trimmed.length === 0 || trimmed.length > maxLength) {
    return null;
  }

  // Prevent common injection patterns
  if (
    /[<>\"'`]/g.test(trimmed) ||
    /javascript:/i.test(trimmed) ||
    /on\w+=/i.test(trimmed)
  ) {
    return null;
  }

  return trimmed;
}

// Session validation helper
export function validateSession(req: Request): boolean {
  const session = req.session as SessionData;

  // Check if session exists and has required properties
  if (!session || !session.userId) {
    return false;
  }

  // Validate session expiration
  if (!session.loginTimestamp) {
    return false;
  }

  const sessionAge = Date.now() - session.loginTimestamp;
  if (sessionAge > SESSION_CONFIG.MAX_AGE) {
    return false;
  }

  // Validate IP address hasn't changed (prevents session hijacking)
  const clientIp = getClientIp(req);
  if (session.ipAddress && session.ipAddress !== clientIp) {
    return false;
  }

  return true;
}

// Helper to get client IP address
export function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "unknown";
}

// Middleware to enforce session validation
export function enforceSessionValidation(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const session = req.session as SessionData;

  if (!session.isAuthenticated || !validateSession(req)) {
    // Fail closed - destroy session on validation failure
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
      }
      res.status(401).json({ error: "Session invalid or expired" });
    });
    return;
  }

  next();
}

// Middleware to regenerate session periodically
export function regenerateSessionPeriodically(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const session = req.session as SessionData;

  if (session.isAuthenticated && session.loginTimestamp) {
    const sessionAge = Date.now() - session.login
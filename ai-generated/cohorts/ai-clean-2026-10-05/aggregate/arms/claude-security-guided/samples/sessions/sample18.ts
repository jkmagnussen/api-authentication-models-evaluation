```typescript
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import { v4 as uuidv4 } from "uuid";

// Type definitions for session data
interface SessionData {
  userId?: string;
  email?: string;
  role?: string;
  loginTime?: number;
  lastActivityTime?: number;
}

// Constants for security
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const SESSION_SECRET = process.env.SESSION_SECRET || "default-insecure-secret";
const SESSION_NAME = "sessionId";
const MAX_SESSION_AGE = 24 * 60 * 60 * 1000; // 24 hours

// Validation utilities
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

export function validateUserId(userId: string): boolean {
  // UUID v4 format validation
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(userId);
}

export function validateRole(role: string): boolean {
  const validRoles = ["user", "admin", "moderator"];
  return validRoles.includes(role.toLowerCase());
}

// Session store implementation
class MemorySessionStore {
  private sessions: Map<string, SessionData & { createdAt: number }> = new Map();

  get(sessionId: string): SessionData | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    // Check if session has expired
    if (Date.now() - session.createdAt > MAX_SESSION_AGE) {
      this.sessions.delete(sessionId);
      return null;
    }

    return session;
  }

  set(sessionId: string, data: SessionData): void {
    if (!sessionId || typeof sessionId !== "string") {
      throw new Error("Invalid session ID");
    }

    this.sessions.set(sessionId, {
      ...data,
      createdAt: Date.now(),
    });
  }

  destroy(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  cleanup(): void {
    // Remove expired sessions
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.createdAt > MAX_SESSION_AGE) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

// Initialize session store
const sessionStore = new MemorySessionStore();

// Periodic cleanup of expired sessions
setInterval(() => {
  sessionStore.cleanup();
}, 60 * 60 * 1000); // Run every hour

export function initializeSessionMiddleware(app: express.Application): void {
  // Configure session middleware with secure defaults
  app.use(
    session({
      name: SESSION_NAME,
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production", // HTTPS only in production
        httpOnly: true, // Prevent client-side JS access
        sameSite: "strict", // CSRF
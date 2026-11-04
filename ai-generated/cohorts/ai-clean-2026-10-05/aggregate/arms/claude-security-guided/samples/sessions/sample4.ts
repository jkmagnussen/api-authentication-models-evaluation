```typescript
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import { createHash, randomBytes } from "crypto";

// Secure defaults configuration
const SESSION_CONFIG = {
  SECRET: process.env.SESSION_SECRET || randomBytes(32).toString("hex"),
  MAX_AGE: 1000 * 60 * 60, // 1 hour
  SECURE: process.env.NODE_ENV === "production",
  HTTP_ONLY: true,
  SAME_SITE: "strict" as const,
  REGENERATE_ON_LOGIN: true,
  ABSOLUTE_TIMEOUT: 1000 * 60 * 60 * 24, // 24 hours
};

// Session data validation schema
interface SessionData {
  userId?: string;
  username?: string;
  roles?: string[];
  loginTime?: number;
  lastActivity?: number;
}

// Validation rules
const VALIDATION_RULES = {
  userId: {
    pattern: /^[a-zA-Z0-9-_]{1,36}$/,
    maxLength: 36,
  },
  username: {
    pattern: /^[a-zA-Z0-9._-]{3,32}$/,
    maxLength: 32,
  },
  roles: {
    allowedRoles: ["user", "admin", "moderator"],
    maxRoles: 5,
  },
};

// Secure input validator
export const validateSessionInput = (
  key: string,
  value: unknown
): boolean => {
  if (value === undefined || value === null) {
    return false;
  }

  switch (key) {
    case "userId":
      if (typeof value !== "string") return false;
      if (value.length > VALIDATION_RULES.userId.maxLength) return false;
      return VALIDATION_RULES.userId.pattern.test(value);

    case "username":
      if (typeof value !== "string") return false;
      if (value.length > VALIDATION_RULES.username.maxLength) return false;
      return VALIDATION_RULES.username.pattern.test(value);

    case "roles":
      if (!Array.isArray(value)) return false;
      if (value.length > VALIDATION_RULES.roles.maxRoles) return false;
      return value.every(
        (role) =>
          typeof role === "string" &&
          VALIDATION_RULES.roles.allowedRoles.includes(role)
      );

    case "loginTime":
    case "lastActivity":
      return typeof value === "number" && value > 0;

    default:
      return false;
  }
};

// Session manager with security features
export class SecureSessionManager {
  private sessionStore: Map<string, SessionData> = new Map();
  private sessionTimestamps: Map<string, number> = new Map();

  setSessionData(
    sessionId: string,
    data: Partial<SessionData>
  ): { success: boolean; error?: string } {
    // Fail closed - validate all data before setting
    for (const [key, value] of Object.entries(data)) {
      if (!validateSessionInput(key, value)) {
        return {
          success: false,
          error: `Invalid session data: ${key}`,
        };
      }
    }

    const now = Date.now();
    const lastActivity = this.sessionTimestamps.get(sessionId) || now;

    // Check absolute timeout
    if (now - lastActivity > SESSION_CONFIG.ABSOLUTE_TIMEOUT) {
      this.sessionStore.delete(sessionId);
      this.sessionTimestamps.
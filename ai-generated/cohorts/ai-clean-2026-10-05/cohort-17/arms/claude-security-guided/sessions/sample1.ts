```typescript
import express, { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import crypto from "crypto";

// Secure session configuration with defaults favoring security
const SESSION_CONFIG = {
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "strict" as const,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
  },
};

// Input validation rules
interface ValidationRule {
  type: "string" | "number" | "email" | "alphanumeric";
  minLength?: number;
  maxLength?: number;
  required?: boolean;
}

const VALIDATION_RULES: Record<string, ValidationRule> = {
  username: {
    type: "alphanumeric",
    minLength: 3,
    maxLength: 20,
    required: true,
  },
  email: { type: "email", maxLength: 255, required: true },
  userId: { type: "number", required: true },
};

// Validation function with fail-closed approach
export function validateInput(
  data: unknown,
  rules: ValidationRule
): boolean {
  if (!data) {
    return !rules.required;
  }

  const stringData = String(data).trim();

  // Fail closed: empty string after trim is invalid
  if (!stringData && rules.required) {
    return false;
  }

  // Check length constraints
  if (
    rules.minLength &&
    stringData.length < rules.minLength
  ) {
    return false;
  }

  if (
    rules.maxLength &&
    stringData.length > rules.maxLength
  ) {
    return false;
  }

  // Type-specific validation
  switch (rules.type) {
    case "alphanumeric":
      return /^[a-zA-Z0-9_-]+$/.test(stringData);
    case "email":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stringData);
    case "number":
      return /^\d+$/.test(stringData) && !isNaN(Number(stringData));
    case "string":
      return true;
    default:
      return false;
  }
}

// Session user type with validation
interface SessionUser {
  id: number;
  username: string;
  email: string;
}

// Extend Express session with custom user property
declare global {
  namespace Express {
    interface Session {
      user?: SessionUser;
      loginAttempts?: number;
      lastLoginAttempt?: number;
    }
  }
}

// Rate limiting for login attempts
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

export function checkLoginAttempts(req: Request): boolean {
  const session = req.session;

  if (!session.lastLoginAttempt) {
    session.loginAttempts = 0;
    session.lastLoginAttempt = Date.now();
    return true;
  }

  const timeSinceLastAttempt = Date.now() - session.lastLoginAttempt;

  // Reset attempts if window has passed
  if (timeSinceLastAttempt > LOGIN_ATTEMPT_WINDOW) {
    session.loginAttempts = 0;
    session
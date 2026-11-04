```typescript
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import { v4 as uuidv4 } from "uuid";

// Session configuration with secure defaults
const SESSION_SECRET = process.env.SESSION_SECRET || uuidv4();
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const SESSION_SECURE = process.env.NODE_ENV === "production";
const SESSION_HTTP_ONLY = true;
const SESSION_SAME_SITE: "lax" | "strict" | "none" = "strict";

// Types for validated user data
interface ValidatedUser {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
}

interface SessionData {
  userId?: string;
  username?: string;
  email?: string;
  createdAt?: Date;
  loginAttempts?: number;
  lastLoginAttempt?: Date;
}

// Declare session module augmentation
declare global {
  namespace Express {
    interface Session {
      user?: ValidatedUser;
      loginAttempts?: number;
      lastLoginAttempt?: Date;
    }
  }
}

// Input validation utilities with fail-closed approach
export function validateUsername(input: unknown): string | null {
  if (typeof input !== "string") {
    return null;
  }

  const trimmed = input.trim();

  // Fail closed: strict validation
  if (trimmed.length < 3 || trimmed.length > 20) {
    return null;
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return null;
  }

  return trimmed;
}

export function validateEmail(input: unknown): string | null {
  if (typeof input !== "string") {
    return null;
  }

  const trimmed = input.trim().toLowerCase();

  // Fail closed: strict email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return null;
  }

  if (trimmed.length > 254) {
    return null;
  }

  return trimmed;
}

export function validateUserId(input: unknown): string | null {
  if (typeof input !== "string") {
    return null;
  }

  const trimmed = input.trim();

  // Fail closed: UUID format validation
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(trimmed)) {
    return null;
  }

  return trimmed;
}

// Session store with in-memory storage (replace with persistent store in production)
class InMemorySessionStore {
  private sessions: Map<string, SessionData> = new Map();
  private sessionExpiry: Map<string, number> = new Map();

  set(sessionId: string, data: SessionData, ttl: number): void {
    this.sessions.set(sessionId, data);
    this.sessionExpiry.set(sessionId, Date.now() + ttl);
  }

  get(sessionId: string): SessionData | null {
    const expiry = this.sessionExpiry.get(sessionId);

    if (!expiry || Date.now() > expiry) {
      this.sessions.delete(session
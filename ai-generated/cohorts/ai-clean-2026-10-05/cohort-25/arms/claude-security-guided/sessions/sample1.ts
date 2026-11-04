```typescript
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { createHash, randomBytes } from 'crypto';

// Type definitions for session data
interface SessionData {
  userId?: string;
  username?: string;
  role?: string;
  loginTime?: number;
  lastActivity?: number;
}

interface UserData {
  id: string;
  username: string;
  passwordHash: string;
  role: string;
}

// Session configuration with secure defaults
const SESSION_CONFIG = {
  maxAge: 1000 * 60 * 30, // 30 minutes
  idleTimeout: 1000 * 60 * 15, // 15 minutes of inactivity
  minPasswordLength: 8,
  maxPasswordLength: 128,
  maxUsernameLength: 50,
  maxUserIdLength: 36,
  maxRoleLength: 20,
};

// In-memory store for demo (in production, use persistent store like Redis)
const users: Map<string, UserData> = new Map();
const sessions: Map<string, SessionData> = new Map();

// Utility functions for secure operations
export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export function generateSessionId(): string {
  return randomBytes(32).toString('hex');
}

// Input validation functions
export function validateUsername(username: unknown): string | null {
  if (typeof username !== 'string') {
    return null;
  }
  const trimmed = username.trim();
  if (trimmed.length === 0 || trimmed.length > SESSION_CONFIG.maxUsernameLength) {
    return null;
  }
  // Allow alphanumeric and underscore only
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string') {
    return null;
  }
  if (
    password.length < SESSION_CONFIG.minPasswordLength ||
    password.length > SESSION_CONFIG.maxPasswordLength
  ) {
    return null;
  }
  return password;
}

export function validateUserId(userId: unknown): string | null {
  if (typeof userId !== 'string') {
    return null;
  }
  const trimmed = userId.trim();
  if (trimmed.length === 0 || trimmed.length > SESSION_CONFIG.maxUserIdLength) {
    return null;
  }
  // Allow alphanumeric and hyphens only
  if (!/^[a-zA-Z0-9-]+$/.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export function validateRole(role: unknown): string | null {
  if (typeof role !== 'string') {
    return null;
  }
  const trimmed = role.trim();
  const validRoles = ['user', 'admin', 'moderator'];
  if (!validRoles.includes(trimmed) || trimmed.length > SESSION_CONFIG.maxRoleLength) {
    return null;
  }
  return trimmed;
}

// Session middleware
export function createSessionMiddleware() {
  return session({
    secret: process.env.SESSION_SECRET || 'default-insecure-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // HTTPS
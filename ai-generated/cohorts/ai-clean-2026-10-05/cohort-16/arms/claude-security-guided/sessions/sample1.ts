```typescript
import express, { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';

// Configuration constants with secure defaults
const SESSION_CONFIG = {
  SECRET: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  MAX_AGE: 3600000, // 1 hour in milliseconds
  SECURE: process.env.NODE_ENV === 'production', // HTTPS only in production
  HTTP_ONLY: true, // Prevent XSS attacks
  SAME_SITE: 'strict' as const, // CSRF protection
  REGENERATE_ON_LOGIN: true,
  DESTROY_ON_LOGOUT: true,
};

// Session data validation schemas
interface ValidatedSessionData {
  userId?: string;
  email?: string;
  role?: string;
  loginTime?: number;
  ipAddress?: string;
  userAgent?: string;
}

// Validate and sanitize user input
export const validateSessionInput = (input: unknown): ValidatedSessionData => {
  if (typeof input !== 'object' || input === null) {
    throw new Error('Invalid session data: must be an object');
  }

  const data = input as Record<string, unknown>;
  const validated: ValidatedSessionData = {};

  // Validate userId - alphanumeric with hyphens only
  if (data.userId !== undefined) {
    if (typeof data.userId !== 'string' || !/^[a-zA-Z0-9_-]{1,255}$/.test(data.userId)) {
      throw new Error('Invalid userId format');
    }
    validated.userId = data.userId;
  }

  // Validate email
  if (data.email !== undefined) {
    if (typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new Error('Invalid email format');
    }
    validated.email = data.email;
  }

  // Validate role - only allow predefined roles
  if (data.role !== undefined) {
    const allowedRoles = ['user', 'admin', 'moderator'];
    if (typeof data.role !== 'string' || !allowedRoles.includes(data.role)) {
      throw new Error('Invalid role');
    }
    validated.role = data.role;
  }

  // Validate loginTime - must be a valid timestamp
  if (data.loginTime !== undefined) {
    if (typeof data.loginTime !== 'number' || data.loginTime < 0 || data.loginTime > Date.now()) {
      throw new Error('Invalid loginTime');
    }
    validated.loginTime = data.loginTime;
  }

  // Validate ipAddress
  if (data.ipAddress !== undefined) {
    if (
      typeof data.ipAddress !== 'string' ||
      !/^(\d{1,3}\.){3}\d{1,3}$|^([a-fA-F0-9]{0,4}:){2,7}[a-fA-F0-9]{0,4}$/.test(data.ipAddress)
    ) {
      throw new Error('Invalid IP address format');
    }
    validated.ipAddress = data.ipAddress;
  }

  // Validate userAgent
  if (data.userAgent !== undefined) {
    if (typeof data.userAgent !== 'string' || data.userAgent.length > 500) {
      throw new Error('Invalid userAgent');
    }
    validated.userAgent = data.userAgent;
  }

  return
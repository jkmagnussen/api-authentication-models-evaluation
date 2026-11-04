```typescript
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';

// Type definitions for session data
interface SessionData {
  userId?: string;
  email?: string;
  loginTime?: number;
  ipAddress?: string;
  userAgent?: string;
}

// Configuration constants with secure defaults
const SESSION_CONFIG = {
  SECRET: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  COOKIE_MAX_AGE: 1000 * 60 * 30, // 30 minutes - short session duration
  COOKIE_SECURE: process.env.NODE_ENV === 'production', // HTTPS only in production
  COOKIE_HTTP_ONLY: true, // Prevent client-side JS access
  COOKIE_SAME_SITE: 'strict' as const, // CSRF protection
  COOKIE_DOMAIN: undefined, // Default to current domain only
  SESSION_REGENERATE_INTERVAL: 1000 * 60 * 15, // Regenerate every 15 minutes
} as const;

// Input validation utilities
export const validateSessionInput = (input: unknown, fieldName: string, maxLength: number = 255): string => {
  // Fail closed - reject any invalid input
  if (typeof input !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }

  if (input.length === 0) {
    throw new Error(`${fieldName} cannot be empty`);
  }

  if (input.length > maxLength) {
    throw new Error(`${fieldName} exceeds maximum length of ${maxLength}`);
  }

  // Sanitize input - remove potential XSS vectors
  const sanitized = input.replace(/[<>\"'&]/g, (char) => {
    const escapeMap: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;',
    };
    return escapeMap[char] || char;
  });

  // Validate against whitelist patterns
  if (fieldName === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitized)) {
      throw new Error('Invalid email format');
    }
  }

  if (fieldName === 'userId') {
    const userIdRegex = /^[a-zA-Z0-9_-]{1,255}$/;
    if (!userIdRegex.test(sanitized)) {
      throw new Error('Invalid userId format');
    }
  }

  return sanitized;
};

// Session security middleware
export const createSessionMiddleware = (app: express.Application) => {
  app.use(
    session({
      secret: SESSION_CONFIG.SECRET,
      name: 'sessionId', // Custom cookie name to avoid default 'connect.sid'
      resave: false, // Don't resave unchanged sessions
      saveUninitialized: false, // Don't create session until something is stored
      cookie: {
        secure: SESSION_CONFIG.COOKIE_SECURE,
        httpOnly: SESSION_CONFIG.COOKIE_HTTP_ONLY,
        sameSite: SESSION_CONFIG.COOKIE_SAME_SITE,
        maxAge: SESSION_CONFIG.COOKIE_MAX_AGE,
        domain: SESSION_CONFIG.COOKIE_DOMAIN,
      },
    })
  );
};

// Session validation middleware
export const validateSessionMiddleware = (
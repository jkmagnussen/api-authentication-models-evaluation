```typescript
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';

// Type definitions for session data
interface SessionData {
  userId?: string;
  email?: string;
  role?: 'user' | 'admin';
  loginTime?: number;
  lastActivity?: number;
}

declare global {
  namespace Express {
    interface Request {
      session: session.Session & Partial<SessionData>;
    }
  }
}

// Session configuration with secure defaults
export const createSessionMiddleware = () => {
  const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
  
  // Validate session secret
  if (!sessionSecret || sessionSecret.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters long');
  }

  return session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    name: 'sessionId',
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      domain: process.env.COOKIE_DOMAIN || 'localhost',
    },
  });
};

// Input validation utilities
export const validateSessionInput = (input: string, fieldName: string): boolean => {
  if (!input || typeof input !== 'string') {
    console.error(`Invalid ${fieldName}: input must be a non-empty string`);
    return false;
  }

  // Prevent XSS and injection attacks
  const maxLength = fieldName === 'userId' ? 50 : 255;
  if (input.length > maxLength) {
    console.error(`Invalid ${fieldName}: exceeds maximum length of ${maxLength}`);
    return false;
  }

  // Only allow alphanumeric, dots, hyphens, and underscores for userId
  if (fieldName === 'userId' && !/^[a-zA-Z0-9._-]+$/.test(input)) {
    console.error(`Invalid ${fieldName}: contains invalid characters`);
    return false;
  }

  // Validate email format
  if (fieldName === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input)) {
      console.error(`Invalid ${fieldName}: invalid email format`);
      return false;
    }
  }

  return true;
};

// Session management functions
export const createSession = (
  req: Request,
  userId: string,
  email: string,
  role: 'user' | 'admin' = 'user'
): boolean => {
  // Validate all inputs - fail closed on validation failure
  if (!validateSessionInput(userId, 'userId')) {
    return false;
  }

  if (!validateSessionInput(email, 'email')) {
    return false;
  }

  if (!['user', 'admin'].includes(role)) {
    console.error('Invalid role provided');
    return false;
  }

  try {
    req.session.userId = userId;
    req.session.email = email;
    req.session.role = role;
    req.session.loginTime = Date.now();
    req.session.lastActivity = Date.now();
    return true;
  } catch (error) {
    console.error('Error creating session:', error);
    return false;
  }
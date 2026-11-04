```typescript
import express, { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';

// Type definitions for session data
interface SessionData {
  userId?: string;
  username?: string;
  isAuthenticated?: boolean;
  loginTime?: number;
  ipAddress?: string;
  userAgent?: string;
}

// Configuration constants with secure defaults
const SESSION_CONFIG = {
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict' as const,
    maxAge: 30 * 60 * 1000, // 30 minutes
  },
  name: 'sessionId',
  rolling: true,
};

// Validation utilities for untrusted input
export const validateInput = {
  username: (username: unknown): string => {
    if (typeof username !== 'string') {
      throw new Error('Username must be a string');
    }
    if (username.length < 3 || username.length > 50) {
      throw new Error('Username must be between 3 and 50 characters');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      throw new Error('Username contains invalid characters');
    }
    return username;
  },

  password: (password: unknown): string => {
    if (typeof password !== 'string') {
      throw new Error('Password must be a string');
    }
    if (password.length < 8 || password.length > 128) {
      throw new Error('Password must be between 8 and 128 characters');
    }
    return password;
  },

  userId: (userId: unknown): string => {
    if (typeof userId !== 'string') {
      throw new Error('User ID must be a string');
    }
    if (!/^[a-zA-Z0-9-]+$/.test(userId) || userId.length > 36) {
      throw new Error('Invalid user ID format');
    }
    return userId;
  },
};

// Session management middleware
export const createSessionManager = (app: Express) => {
  // Configure session middleware with secure defaults
  app.use(
    session({
      ...SESSION_CONFIG,
      store: new (require('memory-store'))(),
    })
  );

  // Middleware to validate session integrity
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Check for session fixation attempts
    if (req.session) {
      const currentIp = req.ip;
      const currentUserAgent = req.get('user-agent');

      if (req.session.ipAddress && req.session.ipAddress !== currentIp) {
        req.session.destroy(() => {
          res.status(401).json({
            error: 'Session validation failed',
            code: 'SESSION_IP_MISMATCH',
          });
        });
        return;
      }

      if (
        req.session.userAgent &&
        req.session.userAgent !== currentUserAgent
      ) {
        req.session.destroy(() => {
          res.status(401).json({
            error: 'Session validation failed',
            code: 'SESSION_UA_MISMATCH',
          });
        });
        return;
      }

      // Check session timeout
      if (req.session.loginTime) {
        const elapsed = Date.now() - req.session
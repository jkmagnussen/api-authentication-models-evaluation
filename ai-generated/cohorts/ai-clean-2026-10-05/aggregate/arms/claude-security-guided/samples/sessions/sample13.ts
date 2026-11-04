```typescript
import express, { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { createHash, randomBytes } from 'crypto';
import { z } from 'zod';

// Secure session configuration with defaults favoring security
const SESSION_CONFIG = {
  secret: process.env.SESSION_SECRET || randomBytes(32).toString('hex'),
  name: 'sessionId',
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent client-side JS access
    sameSite: 'strict' as const, // CSRF protection
    maxAge: 1000 * 60 * 60, // 1 hour
    domain: undefined, // Don't set domain to be restrictive
  },
  resave: false,
  saveUninitialized: false,
  genid: () => randomBytes(32).toString('hex'), // Cryptographically secure IDs
};

// Validation schemas using Zod for untrusted input
const UserDataSchema = z.object({
  userId: z.string().uuid().or(z.string().regex(/^\d+$/)),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/),
  email: z.string().email(),
  roles: z.array(z.enum(['user', 'admin', 'moderator'])).default(['user']),
});

const LoginCredentialsSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(1).max(200),
});

type UserData = z.infer<typeof UserDataSchema>;
type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;

// Extend Express session to include typed user data
declare module 'express-session' {
  interface SessionData {
    user?: UserData;
    loginAttempts?: number;
    lastLoginAttempt?: number;
    csrfToken?: string;
  }
}

// Session management utilities
export const createSessionManager = () => {
  const validateUserData = (data: unknown): UserData => {
    try {
      return UserDataSchema.parse(data);
    } catch (error) {
      throw new Error(`Invalid user data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const validateLoginCredentials = (data: unknown): LoginCredentials => {
    try {
      return LoginCredentialsSchema.parse(data);
    } catch (error) {
      throw new Error(`Invalid login credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const generateCSRFToken = (): string => {
    return randomBytes(32).toString('hex');
  };

  const hashPassword = (password: string): string => {
    return createHash('sha256').update(password).digest('hex');
  };

  return {
    validateUserData,
    validateLoginCredentials,
    generateCSRFToken,
    hashPassword,
  };
};

// Middleware for session security
export const createSessionSecurityMiddleware = () => {
  const checkRateLimit = (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const maxAttempts = 5;
    const lockoutDuration = 15 * 60 * 1000; // 15 minutes

    if (!req.session.loginAttempts) {
      req.session.loginAttempts = 0;
    }

    if (!req.
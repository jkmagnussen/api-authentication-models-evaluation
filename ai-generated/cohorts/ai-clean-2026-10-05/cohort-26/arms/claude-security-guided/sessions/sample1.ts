```typescript
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';

// Secure session configuration with sensible defaults
const SESSION_CONFIG = {
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict' as const,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
  },
  name: 'sessionId',
};

// Initialize Express app
const app = express();

// Middleware setup
app.use(express.json());
app.use(session(SESSION_CONFIG));

// Input validation utility
export function validateInput(input: unknown, maxLength: number = 1000): string {
  if (typeof input !== 'string') {
    throw new Error('Invalid input: expected string');
  }
  if (input.length === 0 || input.length > maxLength) {
    throw new Error(`Invalid input: length must be between 1 and ${maxLength}`);
  }
  // Sanitize input to prevent injection attacks
  return input.replace(/[<>\"']/g, '');
}

// Session validation utility
export function validateSessionData(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid session data: must be an object');
  }
  const record = data as Record<string, unknown>;
  // Validate that session data doesn't exceed reasonable size
  const dataSize = JSON.stringify(record).length;
  if (dataSize > 10000) {
    throw new Error('Session data exceeds maximum size');
  }
  return record;
}

// User interface for type safety
interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
}

// Extend Express session to include user data
declare global {
  namespace Express {
    interface Session {
      user?: User;
      loginAttempts?: number;
      lastLoginAttempt?: number;
    }
  }
}

// Authentication middleware with rate limiting
export function authenticationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    if (!req.session.user) {
      res.status(401).json({ error: 'Unauthorized: no active session' });
      return;
    }
    // Validate session user data
    validateSessionData(req.session.user);
    next();
  } catch (error) {
    res.status(403).json({ error: 'Session validation failed' });
  }
}

// Login endpoint with input validation
export async function handleLogin(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body;

    // Validate input
    const validatedUsername = validateInput(username, 255);
    const validatedPassword = validateInput(password, 255);

    // Check rate limiting
    const now = Date.now();
    if (req.session.loginAttempts === undefined) {
      req.session.loginAttempts = 0;
      req.session.lastLoginAttempt = now;
    }

    const timeSinceLastAttempt = now - (req.session.lastLoginAttempt || 0);
    if (timeSinceLastAttempt < 1000 && req.session
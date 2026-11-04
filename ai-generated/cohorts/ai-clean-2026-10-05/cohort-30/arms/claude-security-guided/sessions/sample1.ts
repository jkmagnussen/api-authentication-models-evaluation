```typescript
import express, { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import StoreFactory from 'connect-mongo';
import crypto from 'crypto';
import { z } from 'zod';

// Secure session configuration with strict validation
const SESSION_CONFIG = {
  // Use secure defaults - fail closed approach
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false, // Don't save unmodified sessions
  saveUninitialized: false, // Don't create session until something stored
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Only HTTPS in production
    httpOnly: true, // Prevent client-side JS access
    sameSite: 'strict' as const, // CSRF protection
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    path: '/',
    domain: undefined, // Will use request domain by default
  },
  name: 'sessionId', // Non-default session name
  trust proxy: true, // Trust X-Forwarded-Proto header
};

// Input validation schemas
const UserDataSchema = z.object({
  userId: z.string().uuid().min(1),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/),
  email: z.string().email(),
  role: z.enum(['user', 'admin', 'moderator']),
});

const LoginCredentialsSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(128),
});

type UserData = z.infer<typeof UserDataSchema>;
type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;

// Session type augmentation
declare global {
  namespace Express {
    interface Request {
      session: session.Session & {
        user?: UserData;
        loginAttempts?: number;
        lastAttempt?: number;
      };
    }
  }
}

// Rate limiting for login attempts - fail closed
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export async function createSessionMiddleware(app: Express): Promise<void> {
  // Use memory store for demo (use MongoDB or Redis in production)
  const mongoStore = StoreFactory(session);
  const sessionStore = new mongoStore({
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/sessions',
    touchAfter: 24 * 3600, // Lazy session update
  });

  app.use(
    session({
      ...SESSION_CONFIG,
      store: sessionStore,
    })
  );
}

// Validate and sanitize user data - fail closed
export function validateUserData(data: unknown): UserData {
  try {
    return UserDataSchema.parse(data);
  } catch (error) {
    console.error('User data validation failed:', error);
    throw new Error('Invalid user data provided');
  }
}

// Validate login credentials
export function validateLoginCredentials(data: unknown): LoginCredentials {
  try {
    return LoginCredentialsSchema.parse(data);
  } catch (error) {
    console.error('Login credentials validation failed:', error);
    throw new Error('Invalid login credentials');
  }
}

// Rate limiting middleware - fail closed approach
export function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
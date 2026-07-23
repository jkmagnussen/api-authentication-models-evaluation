```typescript
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

// Initialize Redis client for session storage
const redisClient = createClient();
redisClient.connect();

// Create Redis store for sessions
const sessionStore = new RedisStore({ client: redisClient });

// Configure secure session middleware
export const configureSecureSessionMiddleware = () => {
  return session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'default-secret-change-in-production',
    name: 'sid',
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 1800000, // 30 minutes
      domain: process.env.COOKIE_DOMAIN,
    },
  });
};

// Interface for authenticated session data
interface AuthenticatedSessionData extends session.SessionData {
  userId?: string;
  email?: string;
  roles?: string[];
  loginTimestamp?: number;
  csrfToken?: string;
}

// Regenerate session after successful authentication
export const regenerateAuthenticationSession = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  req.session.regenerate((err) => {
    if (err) {
      console.error('Session regeneration error:', err);
      return res.status(500).json({ error: 'Session initialization failed' });
    }
    next();
  });
};

// Attach user data to session after login
export const attachUserToSession = (
  req: Request<object, object, { userId: string; email: string; roles?: string[] }>,
  res: Response,
  next: NextFunction
) => {
  const { userId, email, roles = [] } = req.body;

  if (!userId || !email) {
    return res.status(400).json({ error: 'User ID and email are required' });
  }

  const authSession = req.session as AuthenticatedSessionData;
  authSession.userId = userId;
  authSession.email = email;
  authSession.roles = roles;
  authSession.loginTimestamp = Date.now();
  authSession.csrfToken = generateSecureToken();

  req.session.save((err) => {
    if (err) {
      console.error('Session save error:', err);
      return res.status(500).json({ error: 'Failed to establish session' });
    }
    next();
  });
};

// Verify active authenticated session
export const verifyActiveSession = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authSession = req.session as AuthenticatedSessionData;

  if (!authSession.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Verify session hasn't exceeded maximum duration
  const sessionAge = Date.now() - (authSession.loginTimestamp || 0);
  const maxSessionDuration = 86400000; // 24 hours

  if (sessionAge > maxSessionDuration) {
    return res.status(401).json({ error: 'Session expired' });
  }

  next();
};

// Validate CSRF token from session
export const validateCsrfToken = (
  req: Request<object, object, { csrfToken?: string }>,
  res: Response,
  next:
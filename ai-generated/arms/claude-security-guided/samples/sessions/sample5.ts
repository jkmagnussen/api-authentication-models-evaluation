```typescript
import express, { Router, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { randomBytes } from 'crypto';

interface SessionValidation {
  isValid: boolean;
  error?: string;
}

interface UserSession {
  userId: string;
  loginTime: number;
  ipAddress: string;
  userAgent: string;
}

declare global {
  namespace Express {
    interface Session {
      user?: UserSession;
      lastActivity?: number;
    }
  }
}

export const createSecureSessionMiddleware = () => {
  const sessionConfig = session({
    secret: process.env.SESSION_SECRET || randomBytes(32).toString('hex'),
    name: '__session',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict' as const,
      maxAge: 30 * 60 * 1000,
      path: '/',
      domain: process.env.SESSION_DOMAIN,
    },
    proxy: process.env.NODE_ENV === 'production',
  });

  return sessionConfig;
};

export const validateSessionIntegrity = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.session.user) {
    next();
    return;
  }

  const validation = checkSessionHealth(req);

  if (!validation.isValid) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
      }
      res.status(401).json({ error: validation.error || 'Session invalid' });
    });
    return;
  }

  req.session.lastActivity = Date.now();
  next();
};

export const checkSessionHealth = (req: Request): SessionValidation => {
  const session = req.session.user;

  if (!session) {
    return { isValid: false, error: 'No active session' };
  }

  const clientIp = (req.ip || '').toString();
  const clientUA = req.get('user-agent') || '';

  if (session.ipAddress !== clientIp) {
    return { isValid: false, error: 'IP address mismatch' };
  }

  if (session.userAgent !== clientUA) {
    return { isValid: false, error: 'User agent mismatch' };
  }

  const sessionAge = Date.now() - session.loginTime;
  const maxSessionDuration = 4 * 60 * 60 * 1000;

  if (sessionAge > maxSessionDuration) {
    return { isValid: false, error: 'Session expired' };
  }

  const inactivityTimeout = 30 * 60 * 1000;
  const lastActivity = req.session.lastActivity || session.loginTime;

  if (Date.now() - lastActivity > inactivityTimeout) {
    return { isValid: false, error: 'Inactivity timeout' };
  }

  return { isValid: true };
};

export const initiateSecureLogin = (
  req: Request,
  userId: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const currentSession = req.session;

    req.session.regenerate((err) => {
      if (err) {
        reject(new Error('Session regeneration failed'));
        return;
      }

      const clientIp = (req.ip || '').toString();
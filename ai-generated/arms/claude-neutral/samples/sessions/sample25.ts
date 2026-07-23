```typescript
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import path from 'path';

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      email: string;
      role: string;
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    user?: Express.User;
    loginAttempts?: number;
    lastActivity?: number;
  }
}

export const initializeSessionMiddleware = () => {
  return session({
    secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
      sameSite: 'lax',
    },
  });
};

export const validateSessionActivity = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.session.user) {
    const now = Date.now();
    const lastActivity = req.session.lastActivity || now;
    const inactivityTimeout = 1000 * 60 * 30;

    if (now - lastActivity > inactivityTimeout) {
      req.session.destroy((err) => {
        if (err) console.error('Session destruction error:', err);
        res.status(401).json({ error: 'Session expired due to inactivity' });
      });
      return;
    }

    req.session.lastActivity = now;
  }
  next();
};

export const requireActiveSession = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

export const restrictToAdmins = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const handleLoginAttempts = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const MAX_ATTEMPTS = 5;
  const RESET_TIME = 1000 * 60 * 15;

  if (!req.session.loginAttempts) {
    req.session.loginAttempts = 0;
  }

  if (req.session.loginAttempts >= MAX_ATTEMPTS) {
    return res.status(429).json({
      error: 'Too many login attempts. Please try again later.',
    });
  }

  next();
};

export const trackLoginAttempt = (
  req: Request,
  failed: boolean = false
): void => {
  if (failed) {
    req.session.loginAttempts = (req.session.loginAttempts || 0) + 1;
  } else {
    req.session.loginAttempts = 0;
  }
  req.session.save();
};

export const createUserSession = (
  req: Request,
  user: Express.User
): Promise<void> => {
  return new Promise((resolve, reject) => {
    req.session.user = user;
    req.session.loginAttempts =
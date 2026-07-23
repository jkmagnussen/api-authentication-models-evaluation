```typescript
import express, { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { randomBytes } from 'crypto';

declare global {
  namespace Express {
    interface Session {
      userId?: string;
      isAuthenticated?: boolean;
      loginTimestamp?: number;
      ipAddress?: string;
    }
  }
}

interface SessionValidationOptions {
  maxSessionAge?: number;
  requireSecureConnection?: boolean;
  validateIpAddress?: boolean;
}

const DEFAULT_SESSION_OPTIONS: SessionValidationOptions = {
  maxSessionAge: 30 * 60 * 1000,
  requireSecureConnection: true,
  validateIpAddress: true,
};

export function setupSecureSessionManagement(
  app: Express,
  validationOptions: SessionValidationOptions = {}
): void {
  const options = { ...DEFAULT_SESSION_OPTIONS, ...validationOptions };

  app.use(
    session({
      name: '__Secure-sessionId',
      secret: process.env.SESSION_SECRET || randomBytes(32).toString('hex'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: options.requireSecureConnection ?? true,
        httpOnly: true,
        sameSite: 'strict',
        maxAge: options.maxSessionAge,
        path: '/',
      },
      genid: () => randomBytes(32).toString('hex'),
    })
  );
}

export function validateSessionIntegrity(
  validationOptions: SessionValidationOptions = {}
): (req: Request, res: Response, next: NextFunction) => void {
  const options = { ...DEFAULT_SESSION_OPTIONS, ...validationOptions };

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session) {
      return res.status(401).json({ error: 'Session not available' });
    }

    const now = Date.now();
    const sessionCreatedAt = req.session.loginTimestamp || now;
    const sessionAge = now - sessionCreatedAt;

    if (sessionAge > (options.maxSessionAge || 1800000)) {
      req.session.destroy((err) => {
        if (err) console.error('Session destruction error:', err);
      });
      return res.status(401).json({ error: 'Session expired' });
    }

    if (options.validateIpAddress && req.ip) {
      if (!req.session.ipAddress) {
        req.session.ipAddress = req.ip;
      } else if (req.session.ipAddress !== req.ip) {
        req.session.destroy((err) => {
          if (err) console.error('Session destruction error:', err);
        });
        return res.status(401).json({ error: 'IP address mismatch' });
      }
    }

    next();
  };
}

export function performAuthenticationRefresh(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.session) {
    return res.status(401).json({ error: 'No session available' });
  }

  if (!req.session.isAuthenticated) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const currentTimestamp = Date.now();
  const lastRefreshTime = (req.session as any).lastRefreshTime || 0;
  const refreshInterval = 5 * 60 * 1000;

  if (currentTimestamp - lastRefreshTime > refreshInterval) {
    req.session.regenerate((err) => {
```typescript
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';

declare global {
  namespace Express {
    interface SessionData {
      userId?: string;
      username?: string;
      loginTime?: number;
      permissions?: string[];
      isAuthenticated?: boolean;
    }
  }
}

const sessionStore = new Map<string, any>();

export const initializeSessionMiddleware = (app: express.Application): void => {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'dev-secret-key-12345',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24,
        sameSite: 'strict'
      }
    })
  );
};

export const createUserSession = (
  req: Request,
  userId: string,
  username: string,
  permissions: string[] = []
): void => {
  req.session.userId = userId;
  req.session.username = username;
  req.session.loginTime = Date.now();
  req.session.permissions = permissions;
  req.session.isAuthenticated = true;
};

export const validateSession = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.session.isAuthenticated) {
    res.status(401).json({ error: 'Session not authenticated' });
    return;
  }
  next();
};

export const requirePermission = (requiredPermission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session.permissions?.includes(requiredPermission)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
};

export const destroyUserSession = (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Failed to destroy session' });
      return;
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Session terminated successfully' });
  });
};

export const getSessionInfo = (req: Request): {
  userId: string | undefined;
  username: string | undefined;
  loginTime: number | undefined;
  sessionDuration: number;
} => {
  return {
    userId: req.session.userId,
    username: req.session.username,
    loginTime: req.session.loginTime,
    sessionDuration: req.session.loginTime ? Date.now() - req.session.loginTime : 0
  };
};

export const refreshSessionTimeout = (req: Request): void => {
  if (req.session) {
    req.session.touch();
  }
};

export const revokeSessionPermission = (req: Request, permission: string): void => {
  if (req.session.permissions) {
    req.session.permissions = req.session.permissions.filter(p => p !== permission);
  }
};

export const grantSessionPermission = (req: Request, permission: string): void => {
  if (!req.session.permissions) {
    req.session.permissions = [];
  }
  if (!req.session.permissions.includes(permission)) {
    req.session.permissions.push(permission);
  }
};

export const setupAuth
```typescript
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';

interface SessionData {
  userId?: string;
  username?: string;
  email?: string;
  roles?: string[];
  loginTime?: Date;
  lastActivity?: Date;
  isAuthenticated?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      session: session.Session & Partial<SessionData>;
    }
  }
}

const generateSessionSecret = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const createSessionMiddleware = () => {
  return session({
    secret: process.env.SESSION_SECRET || generateSessionSecret(),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
      sameSite: 'lax' as const,
    },
    name: 'sessionId',
  });
};

export const requireAuthenticationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.session.isAuthenticated || !req.session.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  req.session.lastActivity = new Date();
  next();
};

export const requireRoleMiddleware = (requiredRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session.isAuthenticated) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const userRoles = req.session.roles || [];
    const hasRequiredRole = requiredRoles.some((role) =>
      userRoles.includes(role)
    );

    if (!hasRequiredRole) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

export const loginHandler = (req: Request, res: Response): void => {
  const { username, password, email } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Missing credentials' });
    return;
  }

  const userId = crypto.randomUUID();
  req.session.userId = userId;
  req.session.username = username;
  req.session.email = email || '';
  req.session.roles = ['user'];
  req.session.isAuthenticated = true;
  req.session.loginTime = new Date();
  req.session.lastActivity = new Date();

  res.json({
    message: 'Login successful',
    user: {
      userId,
      username,
      email: email || '',
      roles: ['user'],
    },
  });
};

export const logoutHandler = (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Logout failed' });
      return;
    }

    res.clearCookie('sessionId');
    res.json({ message: 'Logout successful' });
  });
};

export const getCurrentUserHandler = (req: Request, res: Response): void => {
  if (!req.session.isAuthenticated) {
    res.status(401).json({ error: 'Not authenticated' });
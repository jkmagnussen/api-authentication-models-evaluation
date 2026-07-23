```typescript
import express, { Request, Response, NextFunction } from 'express';
import session, { SessionOptions } from 'express-session';
import { v4 as uuidv4 } from 'uuid';

interface CustomSessionData {
  userId?: string;
  username?: string;
  email?: string;
  loginTime?: Date;
  lastActivity?: Date;
  permissions?: string[];
}

declare global {
  namespace Express {
    interface Session extends CustomSessionData {}
  }
}

const sessionConfig: SessionOptions = {
  secret: process.env.SESSION_SECRET || 'default-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'strict',
  },
  name: 'sessionId',
};

export function createSessionMiddleware() {
  return session(sessionConfig);
}

export function requireAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Unauthorized - Session not found' });
  }
  req.session.lastActivity = new Date();
  next();
}

export function optionalSessionMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.session?.userId) {
    req.session.lastActivity = new Date();
  }
  next();
}

export async function loginHandler(req: Request, res: Response) {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const userId = uuidv4();
  req.session.userId = userId;
  req.session.username = username;
  req.session.email = email;
  req.session.loginTime = new Date();
  req.session.lastActivity = new Date();
  req.session.permissions = ['read', 'write'];

  res.json({
    message: 'Login successful',
    user: {
      userId,
      username,
      email,
    },
  });
}

export async function logoutHandler(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.clearCookie('sessionId');
    res.json({ message: 'Logout successful' });
  });
}

export async function profileHandler(req: Request, res: Response) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  res.json({
    userId: req.session.userId,
    username: req.session.username,
    email: req.session.email,
    loginTime: req.session.loginTime,
    lastActivity: req.session.lastActivity,
    permissions: req.session.permissions,
  });
}

export async function updateSessionHandler(req: Request, res: Response) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { permissions } = req.body;

  if (permissions && Array.isArray(permissions)) {
    req.session.permissions = permissions;
  }

  req.session.lastActivity = new Date();
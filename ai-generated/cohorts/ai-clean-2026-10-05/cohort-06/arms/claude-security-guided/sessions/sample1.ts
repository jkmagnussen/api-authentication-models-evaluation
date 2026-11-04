```typescript
import express, { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { randomBytes } from 'crypto';

const createSecureSessionMiddleware = () => {
  return session({
    secret: process.env.SESSION_SECRET || randomBytes(32).toString('hex'),
    name: 'sessionId',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24,
    },
  });
};

const validateSessionData = (data: unknown): boolean => {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.userId !== 'string' || obj.userId.length === 0) {
    return false;
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(obj.userId)) {
    return false;
  }

  if (obj.role && typeof obj.role !== 'string') {
    return false;
  }

  if (obj.role && !['admin', 'user', 'guest'].includes(obj.role)) {
    return false;
  }

  return true;
};

const validateUserInput = (input: unknown): string => {
  if (typeof input !== 'string') {
    throw new Error('Invalid input: must be a string');
  }

  const trimmed = input.trim();

  if (trimmed.length === 0 || trimmed.length > 100) {
    throw new Error('Invalid input: length must be between 1 and 100 characters');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    throw new Error('Invalid input: only alphanumeric characters, hyphens, and underscores allowed');
  }

  return trimmed;
};

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized: session required' });
  }

  if (!validateSessionData(req.session)) {
    req.session.destroy(() => {
      res.status(401).json({ error: 'Invalid session data' });
    });
    return;
  }

  next();
};

const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session || req.session.role !== role) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
    }

    next();
  };
};

export const setupSessionManagement = (app: Express) => {
  app.use(express.json());
  app.use(createSecureSessionMiddleware());

  app.post('/login', (req: Request, res: Response) => {
    try {
      const userId = validateUserInput(req.body.userId);
      const role = req.body.role ? validateUserInput(req.body.role) : 'user';

      if (role && !['admin', 'user', 'guest'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      req.session.userId = userId;
      req.session.role = role;
      req.session.loginTime =
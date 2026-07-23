```typescript
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import Store from 'connect-mongo';
import mongoSanitize from 'mongo-sanitize';

interface CustomSessionData {
  userId?: string;
  username?: string;
  email?: string;
  roles?: string[];
  lastActivity?: Date;
  loginAttempts?: number;
  isVerified?: boolean;
}

declare global {
  namespace Express {
    interface Session {
      customData?: CustomSessionData;
      regenerateId(callback: (err?: Error) => void): void;
    }
  }
}

const createSessionMiddleware = () => {
  return session({
    secret: process.env.SESSION_SECRET || 'default-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    store: new Store({
      mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/session-store',
      touchAfter: 24 * 3600,
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
      sameSite: 'strict',
    },
    name: 'sessionId',
  });
};

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.session.customData?.userId) {
    req.session.customData.lastActivity = new Date();
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
      }
      next();
    });
  } else {
    res.status(401).json({ message: 'Authentication required' });
  }
};

export const loginHandler = (req: Request, res: Response) => {
  const { username, password, email } = req.body;

  if (!username || !password) {
    res.status(400).json({ message: 'Username and password required' });
    return;
  }

  const sanitizedUsername = mongoSanitize().replace(username);
  const sanitizedEmail = mongoSanitize().replace(email || '');

  if (!req.session.customData) {
    req.session.customData = {};
  }

  req.session.customData.userId = `user_${Date.now()}`;
  req.session.customData.username = sanitizedUsername;
  req.session.customData.email = sanitizedEmail;
  req.session.customData.roles = ['user'];
  req.session.customData.lastActivity = new Date();
  req.session.customData.loginAttempts = 0;
  req.session.customData.isVerified = true;

  req.session.regenerateId((err) => {
    if (err) {
      res.status(500).json({ message: 'Session error' });
      return;
    }

    res.json({
      message: 'Login successful',
      user: {
        id: req.session.customData?.userId,
        username: req.session.customData?.username,
      },
    });
  });
};

export const logoutHandler = (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ message: 'Logout failed' });
      return;
    }

    res.clearCookie('sessionId');
    res
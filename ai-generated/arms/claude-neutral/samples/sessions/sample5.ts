```typescript
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';

const app = express();

interface UserSession extends session.SessionData {
  userId?: string;
  username?: string;
  loginTimestamp?: number;
  isAuthenticated?: boolean;
  permissions?: string[];
}

declare global {
  namespace Express {
    interface Request {
      userSession?: UserSession;
    }
  }
}

export const configureSessionMiddleware = () => {
  const sessionConfig = session({
    secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax' as const,
    },
  });

  return sessionConfig;
};

export const initializeAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  req.userSession = {
    ...req.session,
  } as UserSession;
  next();
};

export const loginHandler = (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  if (password === 'demo-password') {
    const sessionData: UserSession = {
      userId: crypto.randomUUID(),
      username,
      loginTimestamp: Date.now(),
      isAuthenticated: true,
      permissions: ['read', 'write'],
    };

    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({ error: 'Session regeneration failed' });
      }

      Object.assign(req.session, sessionData);
      req.session.save((saveErr) => {
        if (saveErr) {
          return res.status(500).json({ error: 'Session save failed' });
        }

        res.json({
          success: true,
          user: {
            userId: sessionData.userId,
            username: sessionData.username,
          },
        });
      });
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
};

export const logoutHandler = (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Session destruction failed' });
    }

    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Logged out successfully' });
  });
};

export const checkAuthStatus = (req: Request, res: Response) => {
  if (req.session && req.session.isAuthenticated) {
    return res.json({
      authenticated: true,
      user: {
        userId: req.session.userId,
        username: req.session.username,
        permissions: req.session.permissions,
      },
    });
  }

  res.json({ authenticated: false });
};

export const requireAuthentication = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.isAuthenticated) {
    return res.status(401).json({ error: 'Unauthorized - please login' });
  }

  next();
};

export const requirePermission =
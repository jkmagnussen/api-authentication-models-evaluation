```typescript
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';

const app = express();

interface SessionUser {
  id: string;
  email: string;
  role: string;
  loginTime: number;
}

declare global {
  namespace Express {
    interface Session {
      user?: SessionUser;
    }
  }
}

// Session configuration with secure defaults
const initializeSessionStore = () => {
  return session({
    secret: process.env.SESSION_SECRET || (() => {
      throw new Error('SESSION_SECRET environment variable is required');
    })(),
    name: 'auth.sid',
    store: undefined, // In production, use Redis or database store
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict' as const,
      maxAge: 30 * 60 * 1000, // 30 minutes
      path: '/',
      domain: process.env.COOKIE_DOMAIN,
    },
    rolling: true,
    unset: 'destroy',
  });
};

// Middleware to ensure session is authenticated
export const requireAuthentication = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.session.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
};

// Session regeneration after login
export const regenerateSessionAfterAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  req.session.regenerate((err) => {
    if (err) {
      res.status(500).json({ error: 'Session initialization failed' });
      return;
    }
    next();
  });
};

// Validate session integrity
export const validateSessionIntegrity = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.session.user) {
    const loginTime = req.session.user.loginTime;
    const sessionMaxAge = 30 * 60 * 1000;
    const currentTime = Date.now();

    if (currentTime - loginTime > sessionMaxAge) {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
        }
        res.status(401).json({ error: 'Session expired' });
      });
      return;
    }
  }
  next();
};

// Logout handler with proper session cleanup
export const performLogout = (req: Request, res: Response): void => {
  const sessionId = req.sessionID;

  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      res.status(500).json({ error: 'Logout failed' });
      return;
    }

    // Clear session cookie explicitly
    res.clearCookie('auth.sid', {
      path: '/',
      domain: process.env.COOKIE_DOMAIN,
    });

    console.log(`Session ${sessionId} destroyed successfully`);
    res.json({ message: 'Logged out successfully' });
  });
};

// Login handler with session regeneration
export const authenticateAndCreateSession = (
  req: Request,
  res: Response
): void => {
  // This would normally involve credential verification
  const userId = req.body.userId;
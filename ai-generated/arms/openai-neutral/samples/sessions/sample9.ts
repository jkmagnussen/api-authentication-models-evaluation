```typescript
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';

const app = express();

// Strict type definitions for session data
interface AuthenticatedUser {
  userId: string;
  email: string;
  roles: string[];
  loginTime: number;
}

declare global {
  namespace Express {
    interface Request {
      session: session.Session & Partial<{ user: AuthenticatedUser }>;
    }
  }
}

// Session store configuration (in production use Redis/MongoDB)
class InMemorySessionStore extends session.Store {
  private sessions = new Map<string, any>();

  get(sid: string, callback: (err: Error | null, session?: Express.Session | null) => void): void {
    try {
      const session = this.sessions.get(sid);
      callback(null, session || null);
    } catch (err) {
      callback(err as Error);
    }
  }

  set(sid: string, sess: Express.Session, callback?: (err?: Error | null) => void): void {
    try {
      this.sessions.set(sid, sess);
      callback?.();
    } catch (err) {
      callback?.(err as Error);
    }
  }

  destroy(sid: string, callback?: (err?: Error | null) => void): void {
    try {
      this.sessions.delete(sid);
      callback?.();
    } catch (err) {
      callback?.(err as Error);
    }
  }

  clear(callback?: (err?: Error | null) => void): void {
    try {
      this.sessions.clear();
      callback?.();
    } catch (err) {
      callback?.(err as Error);
    }
  }
}

// Configure secure session middleware
export const initializeSecureSession = (): express.RequestHandler => {
  const sessionStore = new InMemorySessionStore();

  return session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    name: 'ssid',
    genid: (req: Request) => {
      return crypto.randomUUID();
    },
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict' as const,
      maxAge: 30 * 60 * 1000, // 30 minutes
      domain: process.env.COOKIE_DOMAIN,
      path: '/',
    },
  });
};

// Validate session freshness
export const validateSessionFreshness = (
  maxAgeMs: number = 30 * 60 * 1000
): express.RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.user) {
      return next();
    }

    const sessionAge = Date.now() - req.session.user.loginTime;
    if (sessionAge > maxAgeMs) {
      return req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ error: 'Session validation failed' });
        }
        res.clearCookie('ssid', { path: '/', httpOnly: true });
        res.status(401).json({ error: 'Session expired' });
      });
    }

    next();
  };
};

// Regenerate session ID after authentication
export const regenerateSessionId = (req: Request): Promise<void> => {
  return new Promise((
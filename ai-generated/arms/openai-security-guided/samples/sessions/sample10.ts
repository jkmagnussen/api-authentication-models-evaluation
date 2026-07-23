```typescript
import express, { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';

interface SessionData {
  userId?: string;
  authenticated?: boolean;
  loginTime?: number;
}

declare global {
  namespace Express {
    interface Session {
      userId?: string;
      authenticated?: boolean;
      loginTime?: number;
    }
  }
}

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const SECURE_COOKIE_NAME = 'sid';

export function initializeSessionMiddleware(app: Express): void {
  const sessionStore = new session.MemoryStore();

  app.use(
    session({
      store: sessionStore,
      name: SECURE_COOKIE_NAME,
      secret: crypto.randomBytes(32).toString('hex'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: SESSION_TIMEOUT,
        domain: process.env.SESSION_DOMAIN,
        path: '/',
      },
    })
  );
}

export async function authenticateUser(
  req: Request,
  res: Response,
  userId: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err: Error | null) => {
      if (err) {
        reject(new Error('Session regeneration failed'));
        return;
      }

      req.session.userId = userId;
      req.session.authenticated = true;
      req.session.loginTime = Date.now();

      req.session.save((saveErr: Error | null) => {
        if (saveErr) {
          reject(new Error('Session save failed'));
          return;
        }
        resolve();
      });
    });
  });
}

export async function invalidateSession(
  req: Request,
  res: Response
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!req.session) {
      resolve();
      return;
    }

    const sessionId = req.sessionID;

    req.session.destroy((err: Error | null) => {
      if (err) {
        reject(new Error('Session destruction failed'));
        return;
      }

      res.clearCookie(SECURE_COOKIE_NAME, {
        path: '/',
        domain: process.env.SESSION_DOMAIN,
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
      });

      console.log(`Session invalidated for session ID: ${sessionId}`);
      resolve();
    });
  });
}

export function enforceSessionValidity(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.session?.authenticated) {
    res.status(401).json({ error: 'Unauthorized: No valid session' });
    return;
  }

  const loginTime = req.session.loginTime || 0;
  const currentTime = Date.now();

  if (currentTime - loginTime > SESSION_TIMEOUT) {
    req.session.destroy((err: Error | null) => {
      if (err) console.error('Error destroying expired session:', err);
      res.status(401).json({ error: 'Session expired' });
    });
    return;
  }

  next();
}

export async function performSessionRefresh(
  req: Request,
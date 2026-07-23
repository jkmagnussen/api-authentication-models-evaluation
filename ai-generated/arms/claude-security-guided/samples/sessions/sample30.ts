```typescript
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { randomBytes } from 'crypto';

const app = express();

export interface AuthenticatedRequest extends Request {
  session: session.Session & {
    userId?: string;
    regenerate?: (callback: (err?: Error) => void) => void;
    destroy?: (callback: (err?: Error) => void) => void;
  };
}

export function initializeSessionEngine(
  app: express.Application,
  sessionSecret: string
): express.Application {
  const sessionConfig: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    name: 'sid_secure',
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 1800000,
      domain: process.env.COOKIE_DOMAIN || 'localhost',
      path: '/',
    },
    genid: (req) => randomBytes(32).toString('hex'),
  };

  app.use(session(sessionConfig));
  return app;
}

export async function validateSessionIntegrity(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.session || !req.session.userId) {
    res.status(401).json({ error: 'Session invalid or expired' });
    return;
  }

  const userAgent = req.get('user-agent') || '';
  const ipAddress = req.ip || '';

  if (!req.session.userAgent) {
    req.session.userAgent = userAgent;
    req.session.ipAddress = ipAddress;
    next();
    return;
  }

  if (
    req.session.userAgent !== userAgent ||
    req.session.ipAddress !== ipAddress
  ) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction failed:', err);
      }
    });
    res.status(401).json({ error: 'Session validation failed' });
    return;
  }

  next();
}

export async function performSecureLogin(
  req: AuthenticatedRequest,
  userId: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) {
        reject(new Error('Session regeneration failed: ' + err.message));
        return;
      }

      req.session.userId = userId;
      req.session.loginTimestamp = Date.now();
      req.session.userAgent = req.get('user-agent') || '';
      req.session.ipAddress = req.ip || '';
      req.session.csrfToken = randomBytes(32).toString('hex');

      req.session.save((err) => {
        if (err) {
          reject(new Error('Session save failed: ' + err.message));
        } else {
          resolve();
        }
      });
    });
  });
}

export async function executeSecureLogout(
  req: AuthenticatedRequest
): Promise<void> {
  return new Promise((resolve, reject) => {
    const sessionId = req.sessionID;

    req.session.destroy((err) => {
      if (err) {
        reject(new Error('Session destruction failed: ' + err.message));
        return;
      }

      req.res?.clearCookie('sid_secure', {
        path: '/',
        domain: process.env.COOKIE_DOMAIN || 'localhost',
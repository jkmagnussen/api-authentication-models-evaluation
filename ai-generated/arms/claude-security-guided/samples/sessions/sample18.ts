```typescript
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';

interface AuthenticatedRequest extends Request {
  session: session.Session & { userId?: string; loginTime?: number };
}

export const configureSessionMiddleware = (app: express.Application): void => {
  const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
  
  app.use(
    session({
      secret: sessionSecret,
      name: 'auth_token',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 30 * 60 * 1000,
        domain: process.env.COOKIE_DOMAIN,
        path: '/',
      },
      genid: () => crypto.randomUUID(),
    })
  );
};

export const handleUserLogin = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = req.body?.userId;
  
  if (!userId || typeof userId !== 'string' || userId.length === 0) {
    res.status(400).json({ error: 'Invalid user ID' });
    return;
  }

  req.session.regenerate((err) => {
    if (err) {
      res.status(500).json({ error: 'Session regeneration failed' });
      return;
    }

    req.session.userId = userId;
    req.session.loginTime = Date.now();
    req.session.save((saveErr) => {
      if (saveErr) {
        res.status(500).json({ error: 'Session save failed' });
        return;
      }
      res.json({ message: 'Login successful', userId });
    });
  });
};

export const handleUserLogout = (
  req: AuthenticatedRequest,
  res: Response
): void => {
  const sessionId = req.sessionID;
  
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Logout failed' });
      return;
    }

    res.clearCookie('auth_token', {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
    });

    res.json({ message: 'Logout successful', sessionId });
  });
};

export const validateSessionMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.session?.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const loginTime = req.session.loginTime || 0;
  const sessionDuration = Date.now() - loginTime;
  const maxDuration = 30 * 60 * 1000;

  if (sessionDuration > maxDuration) {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ error: 'Session invalidation failed' });
        return;
      }
      res.status(401).json({ error: 'Session expired' });
    });
    return;
  }

  next();
};

export const handleSessionRefresh = (
  req: AuthenticatedRequest,
  res: Response
): void => {
  if (!req.session
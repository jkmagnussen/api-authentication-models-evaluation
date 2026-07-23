```typescript
import express, { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';

interface SessionUserData {
  userId: string;
  username: string;
  loginTimestamp: number;
  ipAddress: string;
}

interface SessionRequest extends Request {
  session: session.Session & { user?: SessionUserData; regenerationError?: Error };
}

export const configureSessionMiddleware = (app: Express): void => {
  const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

  const sessionConfig: session.SessionOptions = {
    secret: sessionSecret,
    name: '__Host-sessionId',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict' as const,
      maxAge: 30 * 60 * 1000,
      path: '/',
      domain: process.env.SESSION_DOMAIN,
    },
  };

  app.use(session(sessionConfig));
};

export const authenticateSession = async (
  req: SessionRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.session.user) {
    return next();
  }

  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress;

  if (req.session.user.ipAddress !== clientIp) {
    req.session.destroy((err) => {
      if (err) console.error('Session destruction error:', err);
    });
    res.status(401).json({ error: 'Session validation failed' });
    return;
  }

  if (Date.now() - req.session.user.loginTimestamp > 30 * 60 * 1000) {
    req.session.destroy((err) => {
      if (err) console.error('Session destruction error:', err);
    });
    res.status(401).json({ error: 'Session expired' });
    return;
  }

  next();
};

export const performLogin = async (
  req: SessionRequest,
  res: Response,
  userId: string,
  username: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress;

    req.session.regenerate((err) => {
      if (err) {
        req.session.regenerationError = err;
        reject(new Error('Failed to regenerate session'));
        return;
      }

      req.session.user = {
        userId,
        username,
        loginTimestamp: Date.now(),
        ipAddress: clientIp || '',
      };

      req.session.save((saveErr) => {
        if (saveErr) {
          reject(new Error('Failed to save session'));
          return;
        }

        res.status(200).json({
          success: true,
          message: 'Login successful',
          sessionId: req.sessionID,
        });
        resolve();
      });
    });
  });
};

export const performLogout = async (req: SessionRequest, res: Response): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!req.session.user) {
      res.status(400).json({ error: 'No active session' });
      resolve();
      return;
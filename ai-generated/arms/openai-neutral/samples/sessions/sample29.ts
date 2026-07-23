```typescript
import express, { Router, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { randomBytes } from 'crypto';

interface AuthenticatedRequest extends Request {
  session: session.Session & {
    userId?: string;
    email?: string;
    loginTime?: number;
    fingerprint?: string;
  };
}

const createSecureSessionConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    secret: process.env.SESSION_SECRET || 'development-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    name: 'sessionId',
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: 'strict' as const,
      maxAge: 60 * 60 * 1000,
      domain: process.env.COOKIE_DOMAIN,
      path: '/'
    },
    rolling: true,
    genid: (req: Request) => {
      return randomBytes(32).toString('hex');
    }
  };
};

export const initializeSessionManagement = (app: express.Application) => {
  app.use(session(createSecureSessionConfig()));
};

export const validateSessionFingerprint = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return next();
  }

  const userAgent = req.get('user-agent') || '';
  const ipAddress = req.ip || req.connection.remoteAddress || '';
  const fingerprint = `${userAgent}:${ipAddress}`;

  if (req.session.fingerprint && req.session.fingerprint !== fingerprint) {
    req.session.destroy((err) => {
      if (err) console.error('Session destruction error:', err);
      return res.status(401).json({ error: 'Session validation failed' });
    });
    return;
  }

  if (!req.session.fingerprint) {
    req.session.fingerprint = fingerprint;
  }

  next();
};

export const requireSessionAuthentication = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const sessionAge = Date.now() - (req.session.loginTime || 0);
  const maxSessionDuration = 24 * 60 * 60 * 1000;

  if (sessionAge > maxSessionDuration) {
    req.session.destroy((err) => {
      if (err) console.error('Session destruction error:', err);
    });
    return res.status(401).json({ error: 'Session expired' });
  }

  next();
};

export const initiateSessionRegeneration = async (req: AuthenticatedRequest): Promise<void> => {
  return new Promise((resolve, reject) => {
    const previousSession = { ...req.session };
    
    req.session.regenerate((err) => {
      if (err) {
        return reject(new Error('Failed to regenerate session'));
      }

      req.session.userId = previousSession.userId;
      req.session.email = previousSession.email;
      req.session.loginTime = Date.now();
      
      const userAgent = req.get('user-agent') || '';
      const ipAddress = req.ip || '';
      req.session.fingerprint = `${userAgent}:${ipAddress}`;

      req.session.save((err
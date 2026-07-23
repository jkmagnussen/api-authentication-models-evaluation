```typescript
import express, { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      sessionId?: string;
    }
  }
}

// Session store implementation with in-memory storage
class SessionRegistry {
  private sessions: Map<string, { userId: string; expiresAt: number }> = new Map();
  private readonly sessionTTL = 3600000; // 1 hour in milliseconds

  set(sessionId: string, userId: string): void {
    this.sessions.set(sessionId, {
      userId,
      expiresAt: Date.now() + this.sessionTTL,
    });
  }

  get(sessionId: string): { userId: string } | null {
    const record = this.sessions.get(sessionId);
    if (!record) return null;

    if (Date.now() > record.expiresAt) {
      this.sessions.delete(sessionId);
      return null;
    }

    return { userId: record.userId };
  }

  revoke(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  clear(): void {
    this.sessions.clear();
  }
}

const sessionRegistry = new SessionRegistry();

export const configureSecureSessionMiddleware = (): express.RequestHandler => {
  return session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    name: '__Host-sessionId',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 3600000,
      domain: undefined,
      path: '/',
    },
    genid: (req: Request): string => {
      return crypto.randomBytes(32).toString('hex');
    },
  });
};

export const validateSessionIntegrity = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.sessionID) {
    res.status(401).json({ error: 'Session not initialized' });
    return;
  }

  const sessionData = sessionRegistry.get(req.sessionID);
  if (!sessionData) {
    res.clearCookie('__Host-sessionId', {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
    });
    res.status(401).json({ error: 'Session invalid or expired' });
    return;
  }

  req.userId = sessionData.userId;
  req.sessionId = req.sessionID;
  next();
};

export const handleSessionEstablishment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.body?.userId;

  if (!userId || typeof userId !== 'string') {
    res.status(400).json({ error: 'Invalid user identifier' });
    return;
  }

  if (!req.sessionID) {
    res.status(500).json({ error: 'Session initialization failed' });
    return;
  }

  sessionRegistry.set(req.sessionID, userId);
  req.userId = userId;

  res.status(200).json({
    message: 'Session established',
    sessionId: req.sessionID,
  });
};

export const performSessionRegeneration = (
  req: Request,
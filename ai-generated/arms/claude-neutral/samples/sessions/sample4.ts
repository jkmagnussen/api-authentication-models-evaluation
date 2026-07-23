```typescript
import express, { Request, Response } from 'express';
import session from 'express-session';
import crypto from 'crypto';

const createSessionManager = () => {
  const sessionStore = new Map<string, SessionData>();

  interface SessionData {
    userId?: string;
    username?: string;
    loginTime?: number;
    activityLog?: string[];
    preferences?: {
      theme?: string;
      language?: string;
    };
  }

  const generateSessionId = (): string => {
    return crypto.randomBytes(32).toString('hex');
  };

  const initializeSession = (sessionId: string): SessionData => {
    const sessionData: SessionData = {
      activityLog: [],
      preferences: {
        theme: 'light',
        language: 'en'
      }
    };
    sessionStore.set(sessionId, sessionData);
    return sessionData;
  };

  const getSession = (sessionId: string): SessionData | undefined => {
    return sessionStore.get(sessionId);
  };

  const updateSession = (sessionId: string, updates: Partial<SessionData>): SessionData | undefined => {
    const existing = sessionStore.get(sessionId);
    if (!existing) return undefined;

    const merged = { ...existing, ...updates };
    sessionStore.set(sessionId, merged);
    return merged;
  };

  const destroySession = (sessionId: string): boolean => {
    return sessionStore.delete(sessionId);
  };

  const logActivity = (sessionId: string, action: string): void => {
    const sess = sessionStore.get(sessionId);
    if (sess && sess.activityLog) {
      sess.activityLog.push(`${new Date().toISOString()}: ${action}`);
      if (sess.activityLog.length > 100) {
        sess.activityLog.shift();
      }
    }
  };

  const validateSession = (sessionId: string): boolean => {
    return sessionStore.has(sessionId);
  };

  return {
    generateSessionId,
    initializeSession,
    getSession,
    updateSession,
    destroySession,
    logActivity,
    validateSession
  };
};

export const setupAuthMiddleware = (app: express.Express) => {
  const sessionManager = createSessionManager();

  app.use(session({
    secret: process.env.SESSION_SECRET || 'development-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    }
  }));

  app.use((req: Request, res: Response, next: express.NextFunction) => {
    if (!req.sessionID) {
      req.sessionID = sessionManager.generateSessionId();
    }

    if (!sessionManager.validateSession(req.sessionID)) {
      sessionManager.initializeSession(req.sessionID);
    }

    next();
  });

  return sessionManager;
};

export const createLoginHandler = (sessionManager: ReturnType<typeof createSessionManager>) => {
  return (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Invalid password' });
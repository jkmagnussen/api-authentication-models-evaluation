```typescript
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';

// Types for session validation
interface SecureSessionOptions {
  sessionTimeout: number;
  cookieDomain?: string;
  cookiePath?: string;
  sameSite?: 'strict' | 'lax' | 'none';
}

interface SessionStore {
  sessions: Map<string, any>;
  get(sessionId: string): Promise<any>;
  set(sessionId: string, sessionData: any): Promise<void>;
  destroy(sessionId: string): Promise<void>;
}

// In-memory session store with validation
export const createValidatedSessionStore = (): SessionStore => {
  const sessions = new Map<string, any>();

  return {
    sessions,
    async get(sessionId: string) {
      const session = sessions.get(sessionId);
      if (!session) return undefined;
      
      if (session.expiresAt && Date.now() > session.expiresAt) {
        sessions.delete(sessionId);
        return undefined;
      }
      
      return session;
    },
    async set(sessionId: string, sessionData: any) {
      if (!sessionId || typeof sessionId !== 'string') {
        throw new Error('Invalid session ID');
      }
      sessions.set(sessionId, sessionData);
    },
    async destroy(sessionId: string) {
      sessions.delete(sessionId);
    }
  };
};

// Create express-session middleware with secure defaults
export const configureSecureSessionMiddleware = (
  options: Partial<SecureSessionOptions> = {}
): express.RequestHandler => {
  const sessionTimeout = options.sessionTimeout || 30 * 60 * 1000; // 30 minutes
  const cookiePath = options.cookiePath || '/';
  const sameSite = options.sameSite || 'strict';
  
  const store = createValidatedSessionStore();

  return session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    store: session.Store.prototype.constructor.prototype || undefined,
    name: 'sessionId',
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: sessionTimeout,
      path: cookiePath,
      domain: options.cookieDomain,
      sameSite: sameSite as any,
    },
  });
};

// Session regeneration with validation
export const regenerateSession = (
  req: Request,
  res: Response
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!req.session) {
      reject(new Error('Session not initialized'));
      return;
    }

    const originalData = { ...req.session };
    
    req.session.regenerate((err: any) => {
      if (err) {
        reject(new Error(`Session regeneration failed: ${err.message}`));
        return;
      }

      // Restore user data without maintaining old session ID
      req.session.userId = originalData.userId;
      req.session.role = originalData.role;
      req.session.regeneratedAt = Date.now();
      req.session.isRegenerated = true;

      req.session.save((saveErr: any) => {
        if (saveErr) {
          reject(new Error(`Session save failed: ${saveErr.message}`));
          return;
        }
        resolve();
      });
    });
  });
};
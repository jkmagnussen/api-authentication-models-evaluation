```typescript
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';

const app = express();

export interface AuthenticatedRequest extends Request {
  session: session.Session & { userId?: string };
}

export const createSecureSessionStore = (): session.Store => {
  // In production, use RedisStore or MongoStore
  const sessions = new Map<string, any>();
  
  return {
    get(sid: string, callback: (err: Error | null, session?: any) => void) {
      try {
        const session = sessions.get(sid);
        callback(null, session || null);
      } catch (err) {
        callback(err as Error);
      }
    },
    set(sid: string, sess: any, callback?: (err?: Error) => void) {
      try {
        sessions.set(sid, sess);
        callback?.(undefined);
      } catch (err) {
        callback?.(err as Error);
      }
    },
    destroy(sid: string, callback?: (err?: Error) => void) {
      try {
        sessions.delete(sid);
        callback?.(undefined);
      } catch (err) {
        callback?.(err as Error);
      }
    },
  } as session.Store;
};

export const configureSessionMiddleware = (
  sessionStore: session.Store
): express.RequestHandler => {
  return session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    name: '__Host-sessionid',
    genid: () => crypto.randomBytes(16).toString('hex'),
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 1800000, // 30 minutes
      domain: process.env.SESSION_DOMAIN,
      path: '/',
    },
    unset: 'destroy',
  });
};

export const initiateSessionRegeneration = async (
  req: AuthenticatedRequest
): Promise<boolean> => {
  return new Promise((resolve) => {
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration failed:', err);
        resolve(false);
        return;
      }
      resolve(true);
    });
  });
};

export const validateSessionIntegrity = (
  req: AuthenticatedRequest
): boolean => {
  if (!req.sessionID) {
    return false;
  }

  if (!req.session) {
    return false;
  }

  if (req.session.createdAt && typeof req.session.createdAt === 'number') {
    const sessionAge = Date.now() - req.session.createdAt;
    const maxAge = 1800000; // 30 minutes
    if (sessionAge > maxAge) {
      return false;
    }
  }

  return true;
};

export const assignUserToSession = async (
  req: AuthenticatedRequest,
  userId: string
): Promise<boolean> => {
  try {
    const regenerated = await initiateSessionRegeneration(req);
    if (!regenerated) {
      return false;
    }

    req.session.userId = userId;
    req.session.createdAt = Date.now();
    req.session.ipAddress = req.ip;
    req.session.userAgent = req.get('user-agent') || '';

    return new Promise((resolve) => {
      req.session.save((
```typescript
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      sessionId?: string;
    }
  }
}

interface SessionData {
  userId: string;
  username: string;
  loginTime: number;
  lastActivity: number;
  permissions: string[];
}

const sessions = new Map<string, SessionData>();

export const initializeSessionMiddleware = (app: express.Application): void => {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24,
      },
    })
  );
};

export const establishUserSession = (
  req: Request,
  res: Response,
  userId: string,
  username: string,
  permissions: string[] = []
): void => {
  const sessionId = uuidv4();
  const sessionData: SessionData = {
    userId,
    username,
    loginTime: Date.now(),
    lastActivity: Date.now(),
    permissions,
  };

  sessions.set(sessionId, sessionData);
  (req.session as any).userId = userId;
  (req.session as any).sessionId = sessionId;
  (req.session as any).username = username;
  (req.session as any).permissions = permissions;
};

export const validateActiveSession = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const sessionId = (req.session as any)?.sessionId;
  const userId = (req.session as any)?.userId;

  if (!sessionId || !userId || !sessions.has(sessionId)) {
    res.status(401).json({ error: 'Session invalid or expired' });
    return;
  }

  const sessionData = sessions.get(sessionId);
  if (!sessionData) {
    res.status(401).json({ error: 'Session not found' });
    return;
  }

  const inactivityTimeout = 1000 * 60 * 30;
  if (Date.now() - sessionData.lastActivity > inactivityTimeout) {
    sessions.delete(sessionId);
    res.status(401).json({ error: 'Session expired due to inactivity' });
    return;
  }

  sessionData.lastActivity = Date.now();
  req.userId = userId;
  req.sessionId = sessionId;

  next();
};

export const checkPermissionLevel = (requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const sessionId = (req.session as any)?.sessionId;
    const sessionData = sessions.get(sessionId || '');

    if (!sessionData) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const hasPermission = requiredPermissions.some((perm) =>
      sessionData.permissions.includes(perm)
    );

    if (!hasPermission) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

export const terminateSession = (req: Request, res
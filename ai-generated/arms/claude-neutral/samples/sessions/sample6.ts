```typescript
import express, { Request, Response, NextFunction } from 'express';
import session, { SessionOptions } from 'express-session';
import MemoryStore from 'memorystore';

const MemStoreFactory = MemoryStore(session);

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    roles: string[];
  };
  sessionID?: string;
}

const buildSessionConfig = (): SessionOptions => ({
  store: new MemStoreFactory({
    checkInterval: 86400000,
  }),
  secret: process.env.SESSION_SECRET || 'change-me-in-production',
  resave: false,
  saveUninitialized: false,
  name: 'auth_session_id',
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 1800000,
    domain: process.env.COOKIE_DOMAIN,
    path: '/',
  },
  proxy: process.env.NODE_ENV === 'production',
});

export const initializeSessionMiddleware = (app: express.Application): void => {
  const sessionConfig = buildSessionConfig();
  app.use(session(sessionConfig));
};

export const requireAuthenticatedSession = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.session || !req.session.userId) {
    res.status(401).json({ error: 'Session expired or invalid' });
    return;
  }

  if (req.session.expiresAt && Date.now() > req.session.expiresAt) {
    req.session.destroy((err) => {
      if (err) console.error('Session destruction error:', err);
    });
    res.status(401).json({ error: 'Session has expired' });
    return;
  }

  next();
};

export const performSessionRegeneration = async (
  req: AuthenticatedRequest
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const previousSessionId = req.sessionID;

    req.session.regenerate((err) => {
      if (err) {
        reject(new Error(`Session regeneration failed: ${err.message}`));
        return;
      }

      const expirationTime = Date.now() + 1800000;
      req.session.expiresAt = expirationTime;
      req.session.regeneratedFrom = previousSessionId;
      req.session.createdAt = Date.now();

      req.session.save((saveErr) => {
        if (saveErr) {
          reject(new Error(`Failed to save regenerated session: ${saveErr.message}`));
          return;
        }
        resolve(req.sessionID || '');
      });
    });
  });
};

export const handleUserLogin = async (
  req: AuthenticatedRequest,
  res: Response,
  userId: string,
  username: string,
  roles: string[]
): Promise<void> => {
  try {
    const newSessionId = await performSessionRegeneration(req);

    req.session.userId = userId;
    req.session.username = username;
    req.session.roles = roles;
    req.session.loginTime = Date.now();

    req.session.save((err) => {
      if (err) {
        res.status(500).json({ error: 'Failed to establish session' });
        return;
      }

      res.status(200).json({
        message:
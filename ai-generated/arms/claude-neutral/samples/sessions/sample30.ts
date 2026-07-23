```typescript
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { v4 as uuidv4 } from 'uuid';

const app = express();

interface UserSession {
  userId?: string;
  username?: string;
  loginTime?: Date;
  permissions?: string[];
  metadata?: Record<string, unknown>;
}

declare global {
  namespace Express {
    interface Session {
      user?: UserSession;
      sessionId?: string;
      createdAt?: Date;
    }
  }
}

export const configureSessionMiddleware = (app: express.Application): void => {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24,
        sameSite: 'strict',
      },
      name: 'sessionId',
      genid: (req: Request) => uuidv4(),
    }),
  );
};

export const requireAuthentication = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.session.user) {
    res.status(401).json({ error: 'Unauthorized access' });
    return;
  }
  next();
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session.user?.permissions?.includes(permission)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
};

export const handleLogin = (req: Request, res: Response): void => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Missing credentials' });
    return;
  }

  if (password !== 'demo-password') {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  req.session.user = {
    userId: uuidv4(),
    username: username,
    loginTime: new Date(),
    permissions: ['read', 'write'],
    metadata: { loginAttempts: 0 },
  };

  req.session.createdAt = new Date();

  res.json({
    success: true,
    message: `Welcome ${username}`,
    sessionId: req.sessionID,
  });
};

export const handleLogout = (req: Request, res: Response): void => {
  const username = req.session.user?.username || 'Unknown';

  req.session.destroy((err: Error | null) => {
    if (err) {
      res.status(500).json({ error: 'Logout failed' });
      return;
    }
    res.clearCookie('sessionId');
    res.json({ success: true, message: `Goodbye ${username}` });
  });
};

export const getSessionInfo = (req: Request, res: Response): void => {
  if (!req.session.user) {
    res.status(401).json({ error: 'No active session' });
    return;
  }

  const sessionDuration = new Date().getTime() - (req.session.createdAt?.getTime() || 0);

  res.json({
    sessionId:
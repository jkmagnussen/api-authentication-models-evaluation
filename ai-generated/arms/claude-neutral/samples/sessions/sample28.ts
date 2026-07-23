```typescript
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { v4 as uuidv4 } from 'uuid';

interface SessionData {
  userId: string;
  username: string;
  email: string;
  loginTime: Date;
  lastActivityTime: Date;
  ipAddress: string;
  userAgent: string;
}

declare global {
  namespace Express {
    interface Session {
      user?: SessionData;
      sessionId?: string;
    }
  }
}

const app = express();

export const initializeSessionManager = () => {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-prod',
      resave: false,
      saveUninitialized: false,
      name: 'sessionId',
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 24,
      },
    })
  );
};

export const requireActiveSession = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'No active session found' });
  }

  const now = new Date();
  const lastActivity = new Date(req.session.user.lastActivityTime);
  const inactivityLimit = 30 * 60 * 1000;

  if (now.getTime() - lastActivity.getTime() > inactivityLimit) {
    req.session.destroy(() => {
      res.status(401).json({ error: 'Session expired due to inactivity' });
    });
    return;
  }

  req.session.user.lastActivityTime = now;
  next();
};

export const createUserSession = (req: Request, res: Response) => {
  const userId = uuidv4();
  const userData: SessionData = {
    userId,
    username: req.body.username || 'guest',
    email: req.body.email || 'guest@example.com',
    loginTime: new Date(),
    lastActivityTime: new Date(),
    ipAddress: req.ip || 'unknown',
    userAgent: req.get('user-agent') || 'unknown',
  };

  req.session.user = userData;
  req.session.sessionId = uuidv4();

  res.json({
    message: 'Session created successfully',
    sessionId: req.session.sessionId,
    user: {
      userId: userData.userId,
      username: userData.username,
    },
  });
};

export const destroyUserSession = (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to destroy session' });
    }
    res.json({ message: 'Session terminated successfully' });
  });
};

export const getCurrentSessionInfo = (req: Request, res: Response) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'No active session' });
  }

  const sessionDuration = Date.now() - new Date(req.session.user.loginTime).getTime();

  res.json({
    sessionId: req.session.sessionId,
    user: {
      userId: req.session.user.userId,
      username: req.session.user.username,
      email: req.session.user
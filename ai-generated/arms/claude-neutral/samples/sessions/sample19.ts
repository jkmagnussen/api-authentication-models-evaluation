```typescript
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';

declare global {
  namespace Express {
    interface Request {
      sessionID?: string;
      session?: session.Session & {
        userId?: string;
        username?: string;
        loginTime?: Date;
        lastActivity?: Date;
      };
    }
  }
}

const MemorySessionStore = MemoryStore(session);

export const setupSessionManagement = (app: express.Application) => {
  const sessionStore = new MemorySessionStore({
    checkPeriod: 86400000,
  });

  app.use(
    session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET || 'dev-session-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24,
        sameSite: 'strict',
      },
      name: 'sessionid.auth',
    })
  );
};

export const validateSessionMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.session && req.session.userId) {
    req.session.lastActivity = new Date();
    return next();
  }
  res.status(401).json({ error: 'Session not authenticated' });
};

export const handleUserLogin = (
  req: Request,
  res: Response
) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  if (password === 'demo-password') {
    req.session.userId = `user-${Date.now()}`;
    req.session.username = username;
    req.session.loginTime = new Date();
    req.session.lastActivity = new Date();

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      sessionId: req.sessionID,
    });
  }

  res.status(401).json({ error: 'Invalid credentials' });
};

export const handleUserLogout = (
  req: Request,
  res: Response
) => {
  const sessionId = req.sessionID;

  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }

    res.clearCookie('sessionid.auth');
    res.status(200).json({
      success: true,
      message: 'Logout successful',
      clearedSession: sessionId,
    });
  });
};

export const getSessionData = (
  req: Request,
  res: Response
) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'No active session' });
  }

  res.status(200).json({
    sessionId: req.sessionID,
    userId: req.session.userId,
    username: req.session.username,
    loginTime: req.session.loginTime,
    lastActivity: req.session.lastActivity,
  });
};

export const updateSessionData = (
  req: Request,
  res: Response
) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).
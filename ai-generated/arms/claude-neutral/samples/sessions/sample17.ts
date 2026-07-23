```typescript
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';

declare global {
  namespace Express {
    interface Session {
      userId?: string;
      userRole?: string;
      loginTimestamp?: number;
      activityLog?: Array<{ action: string; timestamp: number }>;
    }
  }
}

export function setupSessionMiddleware(app: express.Application): void {
  app.use(cookieParser('session-secret-key'));
  
  app.use(
    session({
      name: 'auth_session_id',
      secret: 'super-secret-session-key-12345',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24,
        sameSite: 'strict'
      }
    })
  );
}

export function requireActiveSession(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Session not authenticated' });
    return;
  }
  next();
}

export function logSessionActivity(action: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.session.userId) {
      if (!req.session.activityLog) {
        req.session.activityLog = [];
      }
      req.session.activityLog.push({
        action,
        timestamp: Date.now()
      });
    }
    next();
  };
}

export function handleLoginRoute(
  req: Request,
  res: Response
): void {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'password123') {
    req.session.userId = 'admin-001';
    req.session.userRole = 'administrator';
    req.session.loginTimestamp = Date.now();
    req.session.activityLog = [];

    res.json({
      success: true,
      message: 'Login successful',
      sessionId: req.sessionID
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
}

export function handleLogoutRoute(
  req: Request,
  res: Response
): void {
  const sessionId = req.sessionID;
  
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Logout failed' });
      return;
    }
    res.clearCookie('auth_session_id');
    res.json({
      success: true,
      message: 'Logout successful',
      previousSessionId: sessionId
    });
  });
}

export function handleSessionStatusRoute(
  req: Request,
  res: Response
): void {
  if (!req.session.userId) {
    res.json({
      authenticated: false,
      sessionId: req.sessionID
    });
    return;
  }

  const sessionDuration = Date.now() - (req.session.loginTimestamp || 0);
  
  res.json({
    authenticated: true,
    userId: req.session.userId,
    userRole: req.session.userRole,
    sessionId: req.sessionID,
    sessionDurationMs: sessionDuration,
    activityCount: req.session.activityLog?.length || 0,
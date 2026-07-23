```typescript
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';

const createSessionMiddleware = () => {
  return session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax' as const,
    },
  });
};

export const initializeSessionManager = (app: express.Application) => {
  app.use(express.urlencoded({ extended: true }));
  app.use(createSessionMiddleware());
};

export const requireAuthentication = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized access' });
  }
  next();
};

export const handleLogin = (req: Request, res: Response) => {
  const { username, password } = req.body;

  // Mock validation - in production, verify against database
  if (!username || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  // Mock user authentication
  const userId = crypto.randomBytes(8).toString('hex');

  // Set session data
  req.session.userId = userId;
  req.session.username = username;
  req.session.loginTime = Date.now();

  res.json({
    message: 'Login successful',
    sessionId: req.sessionID,
    user: { userId, username },
  });
};

export const handleLogout = (req: Request, res: Response) => {
  const sessionId = req.sessionID;

  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }

    res.clearCookie('connect.sid');
    res.json({
      message: 'Logout successful',
      previousSessionId: sessionId,
    });
  });
};

export const handleSessionStatus = (req: Request, res: Response) => {
  if (!req.session.userId) {
    return res.status(401).json({ authenticated: false });
  }

  const sessionAge = Date.now() - (req.session.loginTime || 0);

  res.json({
    authenticated: true,
    user: {
      userId: req.session.userId,
      username: req.session.username,
    },
    sessionId: req.sessionID,
    sessionAgeMs: sessionAge,
    loginTime: new Date(req.session.loginTime || 0).toISOString(),
  });
};

export const handleSessionUpdate = (req: Request, res: Response) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'No active session' });
  }

  const { field, value } = req.body;

  if (!field || value === undefined) {
    return res.status(400).json({ error: 'Missing field or value' });
  }

  // Whitelist safe fields to update
  const allowedFields = ['preferences', 'theme', 'language'];

  if (!allowedFields.includes(field)) {
    return res.status(403).json({ error: 'Cannot update this field' });
  }
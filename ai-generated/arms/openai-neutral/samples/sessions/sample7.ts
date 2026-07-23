```typescript
import express, { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { v4 as uuidv4 } from 'uuid';

// Session store interface for validation
interface ValidatedSession {
  userId?: string;
  userName?: string;
  role?: string;
  createdAt: number;
  lastActivity: number;
}

// Configuration object with secure defaults
const buildSessionConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    name: 'sid_auth',
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: 'strict' as const,
      maxAge: 1800000, // 30 minutes
      domain: process.env.COOKIE_DOMAIN,
      path: '/',
    },
    genid: () => uuidv4(),
  };
};

// Session validation middleware
export const validateSessionIntegrity = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.session.createdAt) {
    req.session.createdAt = Date.now();
  }

  req.session.lastActivity = Date.now();

  // Check for session timeout (30 minutes of inactivity)
  const inactivityLimit = 1800000;
  if (req.session.lastActivity - (req.session.createdAt || 0) > inactivityLimit) {
    req.session.destroy((err) => {
      if (err) console.error('Session destruction error:', err);
    });
    res.clearCookie('sid_auth', { path: '/' });
    return res.status(401).json({ error: 'Session expired due to inactivity' });
  }

  next();
};

// Authenticate user and create secure session
export const authenticateAndCreateSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid credentials format' });
  }

  if (username.length > 50 || password.length > 128) {
    return res.status(400).json({ error: 'Credentials exceed maximum length' });
  }

  // Simulate credential verification (replace with actual auth logic)
  if (username !== 'demo' || password !== 'demo123') {
    return res.status(401).json({ error: 'Authentication failed' });
  }

  // Regenerate session ID to prevent fixation attacks
  req.session.regenerate((err) => {
    if (err) {
      console.error('Session regeneration error:', err);
      return res.status(500).json({ error: 'Session creation failed' });
    }

    // Set session data with secure defaults
    req.session.userId = `user_${uuidv4()}`;
    req.session.userName = username;
    req.session.role = 'user';
    req.session.createdAt = Date.now();
    req.session.lastActivity = Date.now();

    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Failed to save
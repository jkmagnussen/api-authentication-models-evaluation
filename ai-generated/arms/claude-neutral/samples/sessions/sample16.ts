```typescript
import express, { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { v4 as uuidv4 } from 'uuid';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  loginTime: Date;
}

interface SessionData {
  profile?: UserProfile;
  visitCount: number;
  preferences: {
    theme: 'light' | 'dark';
    language: string;
  };
}

declare global {
  namespace Express {
    interface Session {
      data: SessionData;
      authenticated: boolean;
    }
  }
}

export function initializeSessionMiddleware(app: Express): void {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'your-session-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      },
    })
  );
}

export function trackVisitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.session.data) {
    req.session.data = {
      visitCount: 0,
      preferences: {
        theme: 'light',
        language: 'en',
      },
    };
  }
  req.session.data.visitCount++;
  next();
}

export function verifyAuthenticationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.session.authenticated && req.session.data.profile) {
    next();
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
}

export function loginHandler(req: Request, res: Response): void {
  const { username, email } = req.body;

  if (!username || !email) {
    res.status(400).json({ error: 'Username and email required' });
    return;
  }

  const userProfile: UserProfile = {
    id: uuidv4(),
    username,
    email,
    role: 'user',
    loginTime: new Date(),
  };

  req.session.authenticated = true;
  req.session.data = {
    ...req.session.data,
    profile: userProfile,
    visitCount: 1,
  };

  res.json({
    message: 'Login successful',
    user: userProfile,
  });
}

export function logoutHandler(req: Request, res: Response): void {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Logout failed' });
      return;
    }
    res.json({ message: 'Logout successful' });
  });
}

export function getSessionStatusHandler(req: Request, res: Response): void {
  const status = {
    authenticated: req.session.authenticated || false,
    visitCount: req.session.data?.visitCount || 0,
    profile: req.session.data?.profile || null,
    preferences: req.session.data?.preferences || null,
  };

  res.json(status);
}

export function updatePreferencesHandler(req: Request, res: Response): void {
  const { theme, language } = req.body;

  if (!req.session.data) {
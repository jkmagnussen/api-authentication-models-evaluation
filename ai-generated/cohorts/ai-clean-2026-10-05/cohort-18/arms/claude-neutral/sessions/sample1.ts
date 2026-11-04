```typescript
import express, { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      sessionID?: string;
    }
  }
}

interface UserSession {
  userId: string;
  username: string;
  loginTime: Date;
  lastActivity: Date;
}

declare module 'express-session' {
  interface SessionData {
    user?: UserSession;
    visitCount: number;
  }
}

export function createSessionMiddleware(secret: string) {
  return session({
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  });
}

export function initializeSessionRoutes(app: Express) {
  app.post('/login', (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    if (password !== 'demo-password') {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const userSession: UserSession = {
      userId: uuidv4(),
      username,
      loginTime: new Date(),
      lastActivity: new Date(),
    };

    req.session.user = userSession;
    req.session.visitCount = 1;

    req.session.save((err) => {
      if (err) {
        res.status(500).json({ error: 'Failed to save session' });
        return;
      }
      res.json({
        message: 'Login successful',
        user: userSession,
        sessionId: req.sessionID,
      });
    });
  });

  app.post('/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ error: 'Failed to logout' });
        return;
      }
      res.json({ message: 'Logout successful' });
    });
  });

  app.get('/profile', (req: Request, res: Response) => {
    if (!req.session.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    req.session.visitCount = (req.session.visitCount || 0) + 1;
    req.session.user.lastActivity = new Date();

    req.session.save((err) => {
      if (err) {
        res.status(500).json({ error: 'Failed to update session' });
        return;
      }

      res.json({
        user: req.session.user,
        visitCount: req.session.visitCount,
        sessionId: req.sessionID,
      });
    });
  });

  app.get('/session-info', (req: Request, res: Response) => {
    res.json({
      hasSession: req.session.user !== undefined,
      sessionId: req.sessionID,
      user: req.session.user || null,
      visitCount: req.session.visitCount || 0,
    });
  });

  app.post('/update-profile', (req: Request, res: Response) => {
    if (!req.session
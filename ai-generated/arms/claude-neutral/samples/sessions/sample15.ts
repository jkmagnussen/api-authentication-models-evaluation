```typescript
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import crypto from 'crypto';

const app = express();

interface UserProfile {
  id: string;
  email: string;
  role: string;
  loginTime: number;
}

declare global {
  namespace Express {
    interface Session {
      userProfile?: UserProfile;
      lastActivity?: number;
      preferences?: Record<string, string>;
      visitCount?: number;
    }
  }
}

export function initializeSessionManager() {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'strict'
      },
      name: 'sessionId'
    })
  );
}

export function validateSessionActivity(req: Request, res: Response, next: NextFunction) {
  if (req.session.userProfile) {
    const now = Date.now();
    const lastActivity = req.session.lastActivity || now;
    const inactivityTimeout = 30 * 60 * 1000;

    if (now - lastActivity > inactivityTimeout) {
      req.session.destroy((err) => {
        if (err) console.error('Session destruction error:', err);
        res.status(401).json({ error: 'Session expired due to inactivity' });
      });
      return;
    }

    req.session.lastActivity = now;
  }

  next();
}

export function enforceAuthentication(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userProfile) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

export function handleLoginRequest(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const mockUserId = crypto.randomUUID();
  const userProfile: UserProfile = {
    id: mockUserId,
    email: email,
    role: 'user',
    loginTime: Date.now()
  };

  req.session.userProfile = userProfile;
  req.session.lastActivity = Date.now();
  req.session.visitCount = (req.session.visitCount || 0) + 1;

  req.session.save((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to establish session' });
    }
    res.json({
      message: 'Login successful',
      user: userProfile,
      sessionId: req.sessionID
    });
  });
}

export function handleLogoutRequest(req: Request, res: Response) {
  if (!req.session.userProfile) {
    return res.status(400).json({ error: 'No active session' });
  }

  const logoutUser = req.session.userProfile.email;

  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.clearCookie('sessionId');
    res.json({ message: `${logoutUser} logged out successfully` });
  });
}
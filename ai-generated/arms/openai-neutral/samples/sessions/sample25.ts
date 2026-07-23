```typescript
import express from 'express';
import session from 'express-session';
import type { Session } from 'express-session';

declare global {
  namespace Express {
    interface Request {
      session: Session & { userId?: string; isAuthenticated?: boolean };
    }
  }
}

const createSessionConfig = () => ({
  secret: process.env.SESSION_SECRET || 'default-insecure-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict' as const,
    maxAge: 3600000,
    domain: process.env.COOKIE_DOMAIN,
  },
  name: 'sid',
});

export const initializeSessionMiddleware = (app: express.Application) => {
  app.use(session(createSessionConfig()));
};

export const refreshSessionIdentifier = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const previousId = req.sessionID;
  
  req.session.regenerate((err) => {
    if (err) {
      console.error('Session regeneration failed:', err);
      return res.status(500).json({ error: 'Session error' });
    }

    req.session.userId = req.body.userId;
    req.session.isAuthenticated = true;

    res.clearCookie('sid');
    
    next();
  });
};

export const validateActiveSession = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (!req.session) {
    return res.status(401).json({ error: 'No session found' });
  }

  if (!req.session.isAuthenticated || !req.session.userId) {
    return res.status(401).json({ error: 'Session not authenticated' });
  }

  const now = Date.now();
  if (req.session.cookie.expires instanceof Date) {
    if (now > req.session.cookie.expires.getTime()) {
      return res.status(401).json({ error: 'Session expired' });
    }
  }

  next();
};

export const terminateUserSession = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const sessionId = req.sessionID;

  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction failed:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }

    res.clearCookie('sid', {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
    });

    next();
  });
};

export const getProtectedRouter = () => {
  const router = express.Router();

  router.post('/auth/login', async (req: express.Request, res: express.Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Invalid password format' });
    }

    refreshSessionIdentifier(req, res, () => {
      res.json({ message: 'Login successful', sessionId: req.sessionID });
    });
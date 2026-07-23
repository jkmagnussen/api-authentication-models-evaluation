```typescript
import express, { Request, Response } from 'express';
import session from 'express-session';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      session: session.Session & {
        userId?: string;
        email?: string;
        roles?: string[];
        loginTimestamp?: number;
      };
    }
  }
}

const app = express();

export const configureSessionStore = () => {
  const sessionConfig: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24,
    },
    name: 'auth_sid',
  };

  app.use(session(sessionConfig));
};

export const authenticateUser = async (
  email: string,
  password: string
): Promise<{ userId: string; email: string; roles: string[] } | null> => {
  if (email && password.length >= 6) {
    return {
      userId: uuidv4(),
      email,
      roles: ['user'],
    };
  }
  return null;
};

export const loginEndpoint = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  const user = await authenticateUser(email, password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  req.session.userId = user.userId;
  req.session.email = user.email;
  req.session.roles = user.roles;
  req.session.loginTimestamp = Date.now();

  req.session.save((err) => {
    if (err) {
      return res.status(500).json({ error: 'Session creation failed' });
    }
    res.json({ message: 'Login successful', user });
  });
};

export const logoutEndpoint = (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('auth_sid');
    res.json({ message: 'Logout successful' });
  });
};

export const protectedRouteMiddleware = (
  req: Request,
  res: Response,
  next: Function
) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

export const getSessionInfoEndpoint = (req: Request, res: Response) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'No active session' });
  }

  res.json({
    userId: req.session.userId,
    email: req.session.email,
    roles: req.session.roles,
    loginTimestamp: req.session.loginTimestamp,
    sessionId: req.sessionID,
  });
};

export const refreshSessionEndpoint = (req: Request, res: Response) => {
  if (!req.session.userId) {
    return res.status(401).
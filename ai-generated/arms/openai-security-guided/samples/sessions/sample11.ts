```typescript
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { randomBytes } from 'crypto';

// Session configuration with secure defaults
const createSecureSessionConfig = () => ({
  secret: process.env.SESSION_SECRET || randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 15 * 60 * 1000, // 15 minutes
    domain: process.env.SESSION_DOMAIN,
  },
  name: 'sid',
});

// Session type declaration
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

// Regenerate session with new ID for security
export const reestablishSession = (req: Request): Promise<void> => {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

// Attach user data to session
export const attachUserToSession = (req: Request, userId: string, email: string): void => {
  if (req.session) {
    req.session.user = { id: userId, email };
  }
};

// Validate active session
export const validateSessionIntegrity = (req: Request): boolean => {
  return !!(req.session && req.session.user && req.session.user.id);
};

// Completely destroy session
export const terminateSessionAndCookie = (req: Request, res: Response): Promise<void> => {
  return new Promise((resolve, reject) => {
    res.clearCookie('sid', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    req.session.destroy((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

// Middleware to enforce authentication
export const enforceSessionAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (!validateSessionIntegrity(req)) {
    res.status(401).json({ error: 'Unauthorized: Invalid or missing session' });
    return;
  }
  next();
};

// Middleware to prevent session fixation
export const preventSessionFixation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await reestablishSession(req);
    next();
  } catch (error) {
    res.status(500).json({ error: 'Session establishment failed' });
  }
};

// Initialize express app with session management
export const setupSessionManagement = (app: express.Application): void => {
  const sessionConfig = createSecureSessionConfig();
  app.use(session(sessionConfig));
};

// Login endpoint with session establishment
export const handleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    // Simulate authentication (replace with real logic)
    if (!email.includes('@') || password.length < 8) {
      res.status(401).json({ error: 'Invalid credentials' });
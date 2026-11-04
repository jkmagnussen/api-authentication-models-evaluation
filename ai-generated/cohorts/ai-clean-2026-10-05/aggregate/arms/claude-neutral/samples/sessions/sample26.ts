```typescript
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { randomBytes } from 'crypto';

// Extend Express Session to include custom user data
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    username?: string;
    email?: string;
    loginTime?: Date;
    lastActivity?: Date;
  }
}

// Initialize Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure session middleware
const sessionConfig = session({
  secret: process.env.SESSION_SECRET || randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' as const,
  },
});

app.use(sessionConfig);

// Middleware to update last activity timestamp
export const updateLastActivity = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.session && req.session.userId) {
    req.session.lastActivity = new Date();
  }
  next();
};

app.use(updateLastActivity);

// Middleware to check if user is authenticated
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized - Please log in' });
  }
  next();
};

// Login endpoint
export const handleLogin = (req: Request, res: Response) => {
  const { username, email } = req.body;

  if (!username || !email) {
    return res.status(400).json({ error: 'Username and email are required' });
  }

  // Simulate user authentication
  req.session.userId = randomBytes(16).toString('hex');
  req.session.username = username;
  req.session.email = email;
  req.session.loginTime = new Date();
  req.session.lastActivity = new Date();

  res.json({
    message: 'Login successful',
    user: {
      userId: req.session.userId,
      username: req.session.username,
      email: req.session.email,
    },
  });
};

app.post('/login', handleLogin);

// Get current session info
export const handleGetSession = (req: Request, res: Response) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'No active session' });
  }

  res.json({
    user: {
      userId: req.session.userId,
      username: req.session.username,
      email: req.session.email,
      loginTime: req.session.loginTime,
      lastActivity: req.session.lastActivity,
    },
    sessionId: req.sessionID,
  });
};

app.get('/session', handleGetSession);

// Protected endpoint example
export const handleProtectedResource = (req: Request, res: Response) => {
  res.json({
    message: 'This is a protected resource',
    user: req.session.username,
    accessTime: new Date(),
  });
};

app.get('/protected', requireAuth, handleProtectedResource);

// Logout endpoint
export const handleLogout = (req: Request, res: Response) => {
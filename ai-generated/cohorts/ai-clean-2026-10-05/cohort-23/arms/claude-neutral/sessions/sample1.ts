```typescript
import express, { Request, Response } from 'express';
import session from 'express-session';
import { v4 as uuidv4 } from 'uuid';

const app = express();

// Configure session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// Middleware to parse JSON bodies
app.use(express.json());

// Types for session data
interface UserSession {
  userId: string;
  username: string;
  email: string;
  loginTime: Date;
}

// Extend Express Session to include custom properties
declare global {
  namespace Express {
    interface Session {
      user?: UserSession;
      sessionId?: string;
    }
  }
}

// In-memory user store (in production, use a database)
const users: Record<string, { username: string; email: string; password: string }> = {
  'user1': { username: 'john_doe', email: 'john@example.com', password: 'password123' },
  'user2': { username: 'jane_smith', email: 'jane@example.com', password: 'password456' }
};

// Login endpoint
export const login = (req: Request, res: Response): void => {
  const { userId, password } = req.body;

  if (!userId || !password) {
    res.status(400).json({ error: 'Missing userId or password' });
    return;
  }

  const user = users[userId];
  if (!user || user.password !== password) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  // Create session
  req.session.user = {
    userId,
    username: user.username,
    email: user.email,
    loginTime: new Date()
  };

  req.session.sessionId = uuidv4();

  req.session.save((err) => {
    if (err) {
      res.status(500).json({ error: 'Failed to save session' });
      return;
    }
    res.json({
      message: 'Login successful',
      user: req.session.user,
      sessionId: req.session.sessionId
    });
  });
};

// Logout endpoint
export const logout = (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Failed to logout' });
      return;
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logout successful' });
  });
};

// Get current session info
export const getSession = (req: Request, res: Response): void => {
  if (!req.session.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  res.json({
    user: req.session.user,
    sessionId: req.session.sessionId,
    sessionExpires: new Date(Date.now() + 1000 * 60 * 60 * 24)
  });
};

// Middleware to check authentication
export const requireAuth = (req: Request, res: Response, next: Function): void => {
  if (!req.session
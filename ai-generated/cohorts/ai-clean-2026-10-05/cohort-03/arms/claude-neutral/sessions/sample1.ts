```typescript
import express, { Express, Request, Response } from 'express';
import session from 'express-session';
import path from 'path';

const app: Express = express();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // Set to true if using HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  })
);

// Extend Express Request to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        username: string;
        email: string;
      };
    }
  }
}

// Middleware to check if user is authenticated
export const requireAuth = (req: Request, res: Response, next: Function) => {
  if (req.session && req.session.userId) {
    req.user = {
      id: req.session.userId,
      username: req.session.username || '',
      email: req.session.email || '',
    };
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Login route
export const handleLogin = (req: Request, res: Response) => {
  const { username, password } = req.body;

  // Simple validation (in production, validate against database)
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  // Simulate user authentication
  if (password === 'password123') {
    req.session.userId = `user_${Date.now()}`;
    req.session.username = username;
    req.session.email = `${username}@example.com`;

    return res.json({
      message: 'Login successful',
      user: {
        id: req.session.userId,
        username: req.session.username,
        email: req.session.email,
      },
    });
  }

  res.status(401).json({ error: 'Invalid credentials' });
};

// Logout route
export const handleLogout = (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ message: 'Logout successful' });
  });
};

// Get current user route
export const getCurrentUser = (req: Request, res: Response) => {
  if (req.session && req.session.userId) {
    return res.json({
      user: {
        id: req.session.userId,
        username: req.session.username,
        email: req.session.email,
      },
    });
  }
  res.status(401).json({ error: 'Not authenticated' });
};

// Protected resource route
export const getProtectedData = (req: Request, res: Response) => {
  res.json({
    message: 'This is protected data',
    user: req.user,
    timestamp: new Date().toISOString(),
  });
};

// Session info route
export const getSessionInfo = (req: Request, res: Response) => {
  if (req.session) {
    res.json({
      sessionId: req.sessionID,
      userId: req.
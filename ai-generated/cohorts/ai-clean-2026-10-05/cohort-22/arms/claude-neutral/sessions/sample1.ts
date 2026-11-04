```typescript
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import path from 'path';

// Extend Express Request to include session user data
declare global {
  namespace Express {
    interface Request {
      session: session.Session & Partial<session.SessionData> & {
        userId?: string;
        username?: string;
        isAuthenticated?: boolean;
      };
    }
  }
}

// Initialize Express app
const app = express();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure session middleware
app.use(
  session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  })
);

// Authentication middleware
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.session.isAuthenticated) {
    next();
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
};

// Login route
export const handleLogin = (req: Request, res: Response): void => {
  const { username, password } = req.body;

  // Simple validation (in production, verify against database)
  if (username && password) {
    req.session.userId = `user_${Date.now()}`;
    req.session.username = username;
    req.session.isAuthenticated = true;

    res.json({
      message: 'Login successful',
      user: {
        id: req.session.userId,
        username: req.session.username,
      },
    });
  } else {
    res.status(400).json({ error: 'Invalid credentials' });
  }
};

// Logout route
export const handleLogout = (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Failed to logout' });
    } else {
      res.json({ message: 'Logout successful' });
    }
  });
};

// Get current user route
export const getCurrentUser = (req: Request, res: Response): void => {
  if (req.session.isAuthenticated) {
    res.json({
      user: {
        id: req.session.userId,
        username: req.session.username,
      },
    });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
};

// Protected route example
export const getProtectedData = (req: Request, res: Response): void => {
  res.json({
    message: 'This is protected data',
    userId: req.session.userId,
    username: req.session.username,
  });
};

// Session info route
export const getSessionInfo = (req: Request, res: Response): void => {
  res.json({
    sessionId: req.sessionID,
    isAuthenticated: req.session.isAuthenticated || false,
    userId: req.session.userId,
    username: req.session.username,
    cookie: {
      maxAge: req.session.cookie.maxAge,
      httpOnly: req.session.cookie.httpOnly,
      secure: req.session.cookie.secure,
    },
  });
};

// Routes
app.post('/login', handleLogin);
```typescript
import express, { Express, Request, Response } from "express";
import session from "express-session";
import { v4 as uuidv4 } from "uuid";

// Declare session user type
declare global {
  namespace Express {
    interface Session {
      userId?: string;
      username?: string;
      email?: string;
      loginTime?: Date;
    }
  }
}

// Initialize Express app
const app: Express = express();

// Configure session middleware
app.use(
  session({
    secret: "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "lax",
    },
  })
);

// Middleware to parse JSON
app.use(express.json());

// Middleware to check if user is authenticated
export const requireAuth = (
  req: Request,
  res: Response,
  next: Function
): void => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Unauthorized - please login first" });
    return;
  }
  next();
};

// Login endpoint
export const login = (req: Request, res: Response): void => {
  const { username, email } = req.body;

  if (!username || !email) {
    res.status(400).json({ error: "Username and email are required" });
    return;
  }

  // Simulate user authentication
  const userId = uuidv4();

  // Set session data
  req.session.userId = userId;
  req.session.username = username;
  req.session.email = email;
  req.session.loginTime = new Date();

  res.json({
    message: "Login successful",
    user: {
      userId,
      username,
      email,
    },
  });
};

// Logout endpoint
export const logout = (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Could not log out" });
      return;
    }
    res.json({ message: "Logout successful" });
  });
};

// Get current session info
export const getSession = (req: Request, res: Response): void => {
  if (!req.session.userId) {
    res.status(401).json({ error: "No active session" });
    return;
  }

  res.json({
    user: {
      userId: req.session.userId,
      username: req.session.username,
      email: req.session.email,
      loginTime: req.session.loginTime,
    },
  });
};

// Update session data
export const updateSession = (req: Request, res: Response): void => {
  if (!req.session.userId) {
    res.status(401).json({ error: "No active session" });
    return;
  }

  const { username, email } = req.body;

  if (username) {
    req.session.username = username;
  }
  if (email) {
    req.session.email = email;
  }

  res.json({
    message: "Session updated",
    user: {
      userId: req.session.userId,
      username: req.session.username,
      email: req.session.email,
    },
  });
};

// Protected route example
export const getProtectedData = (req: Request,
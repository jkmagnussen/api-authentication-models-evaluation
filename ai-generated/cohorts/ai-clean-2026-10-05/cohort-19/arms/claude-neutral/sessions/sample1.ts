```typescript
import express, { Express, Request, Response } from "express";
import session from "express-session";
import path from "path";

// Configure session middleware
export const configureSession = (app: Express): void => {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
      },
    })
  );
};

// Extend Express Session to include custom properties
declare module "express-session" {
  interface SessionData {
    userId?: string;
    username?: string;
    loginCount?: number;
    lastLogin?: Date;
  }
}

// Login route handler
export const handleLogin = (req: Request, res: Response): void => {
  const { username, password } = req.body;

  // Simple validation (in production, verify against database)
  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

  if (password.length < 4) {
    res.status(400).json({ error: "Invalid credentials" });
    return;
  }

  // Set session data
  req.session.userId = `user_${Date.now()}`;
  req.session.username = username;
  req.session.loginCount = (req.session.loginCount || 0) + 1;
  req.session.lastLogin = new Date();

  res.json({
    message: "Login successful",
    userId: req.session.userId,
    username: req.session.username,
    loginCount: req.session.loginCount,
  });
};

// Logout route handler
export const handleLogout = (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Failed to logout" });
      return;
    }
    res.json({ message: "Logout successful" });
  });
};

// Get session info route handler
export const getSessionInfo = (req: Request, res: Response): void => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  res.json({
    userId: req.session.userId,
    username: req.session.username,
    loginCount: req.session.loginCount,
    lastLogin: req.session.lastLogin,
    sessionId: req.sessionID,
  });
};

// Middleware to check if user is authenticated
export const isAuthenticated = (
  req: Request,
  res: Response,
  next: (err?: Error) => void
): void => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
};

// Update session data route handler
export const updateSessionData = (req: Request, res: Response): void => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { username } = req.body;

  if (username) {
    req.session.username = username;
  }

  res.json({
    message: "Session updated",
    username: req.session.username,
  });
};

// Create and configure Express app
export const
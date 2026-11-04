```typescript
import express, { Request, Response } from "express";
import session from "express-session";
import path from "path";
import fs from "fs";

const app = express();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure session middleware
app.use(
  session({
    secret: "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // Set to true if using HTTPS
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      httpOnly: true,
    },
  })
);

// Extend Express Request type to include user data in session
declare global {
  namespace Express {
    interface Session {
      userId?: string;
      userName?: string;
      email?: string;
      loginTime?: Date;
      isAuthenticated?: boolean;
    }
  }
}

// Middleware to check if user is authenticated
export const requireAuth = (
  req: Request,
  res: Response,
  next: Function
) => {
  if (req.session.isAuthenticated) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized - Please login first" });
  }
};

// Login route
export const login = (req: Request, res: Response) => {
  const { username, email } = req.body;

  if (!username || !email) {
    res.status(400).json({ error: "Username and email are required" });
    return;
  }

  // Simulate user authentication
  req.session.userId = Math.random().toString(36).substr(2, 9);
  req.session.userName = username;
  req.session.email = email;
  req.session.loginTime = new Date();
  req.session.isAuthenticated = true;

  req.session.save((err) => {
    if (err) {
      res.status(500).json({ error: "Session save failed" });
      return;
    }
    res.json({
      message: "Login successful",
      user: {
        id: req.session.userId,
        name: req.session.userName,
        email: req.session.email,
      },
    });
  });
};

// Get current session data
export const getSession = (req: Request, res: Response) => {
  if (!req.session.isAuthenticated) {
    res.status(401).json({ error: "No active session" });
    return;
  }

  res.json({
    session: {
      userId: req.session.userId,
      userName: req.session.userName,
      email: req.session.email,
      loginTime: req.session.loginTime,
      sessionId: req.sessionID,
    },
  });
};

// Update session data
export const updateSession = (req: Request, res: Response) => {
  if (!req.session.isAuthenticated) {
    res.status(401).json({ error: "No active session" });
    return;
  }

  const { userName, email } = req.body;

  if (userName) req.session.userName = userName;
  if (email) req.session.email = email;

  req.session.save((err) => {
    if (err) {
      res.status(500).json({ error: "Session update failed" });
      return;
    }
    res.json({
      message: "Session updated",
      user: {
        id: req.session.userId,
        name: req.session.
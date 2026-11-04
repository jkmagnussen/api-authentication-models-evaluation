```typescript
import express, { Express, Request, Response } from "express";
import session from "express-session";

// Extend Express Request to include our custom session data
declare global {
  namespace Express {
    interface Session {
      userId?: string;
      username?: string;
      loginTime?: Date;
      isAuthenticated?: boolean;
    }
  }
}

export function createSessionMiddleware() {
  return session({
    secret: "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true if using HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  });
}

export function loginHandler(req: Request, res: Response) {
  const { username, password } = req.body;

  // Simple authentication (in production, validate against database)
  if (username && password === "password123") {
    req.session.userId = `user_${Date.now()}`;
    req.session.username = username;
    req.session.loginTime = new Date();
    req.session.isAuthenticated = true;

    req.session.save((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to save session" });
      }
      res.json({
        message: "Login successful",
        userId: req.session.userId,
        username: req.session.username,
      });
    });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
}

export function logoutHandler(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to logout" });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Logout successful" });
  });
}

export function profileHandler(req: Request, res: Response) {
  if (!req.session.isAuthenticated) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  res.json({
    userId: req.session.userId,
    username: req.session.username,
    loginTime: req.session.loginTime,
    sessionId: req.sessionID,
  });
}

export function sessionStatusHandler(req: Request, res: Response) {
  res.json({
    isAuthenticated: !!req.session.isAuthenticated,
    username: req.session.username || null,
    sessionId: req.sessionID,
  });
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: Function
) {
  if (!req.session.isAuthenticated) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export function updateSessionHandler(req: Request, res: Response) {
  if (!req.session.isAuthenticated) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { theme, language } = req.body;

  // Store additional session data
  if (theme) {
    (req.session as any).theme = theme;
  }
  if (language) {
    (req.session as any).language = language;
  }

  req.session.save((err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to update session" });
    }
    res.json({ message: "
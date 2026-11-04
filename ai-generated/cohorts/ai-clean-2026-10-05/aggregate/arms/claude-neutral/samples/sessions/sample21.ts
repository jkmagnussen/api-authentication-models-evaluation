```typescript
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import { randomUUID } from "crypto";

// Session data interface
interface SessionData {
  userId?: string;
  username?: string;
  loginTime?: Date;
  isAdmin?: boolean;
}

// Extend Express Session to include our custom data
declare global {
  namespace Express {
    interface Session {
      userId?: string;
      username?: string;
      loginTime?: Date;
      isAdmin?: boolean;
    }
  }
}

// Initialize session middleware
export function initializeSession(app: express.Express): void {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "your-secret-key-change-this",
      resave: false,
      saveUninitialized: true,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        sameSite: "lax",
      },
    })
  );
}

// Middleware to check if user is authenticated
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized - Please log in" });
  }
}

// Middleware to check if user is admin
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.session.userId && req.session.isAdmin) {
    next();
  } else {
    res.status(403).json({ error: "Forbidden - Admin access required" });
  }
}

// Login handler
export function handleLogin(req: Request, res: Response): void {
  const { username, password } = req.body;

  // Simple validation (in production, validate against database)
  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

  // Simulate user authentication
  const userId = randomUUID();
  const isAdmin = username === "admin";

  // Set session data
  req.session.userId = userId;
  req.session.username = username;
  req.session.loginTime = new Date();
  req.session.isAdmin = isAdmin;

  res.json({
    message: "Login successful",
    user: {
      userId,
      username,
      isAdmin,
    },
  });
}

// Logout handler
export function handleLogout(req: Request, res: Response): void {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Failed to logout" });
      return;
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Logout successful" });
  });
}

// Get current session info
export function getSessionInfo(req: Request, res: Response): void {
  if (req.session.userId) {
    res.json({
      sessionId: req.sessionID,
      user: {
        userId: req.session.userId,
        username: req.session.username,
        loginTime: req.session.loginTime,
        isAdmin: req.session.isAdmin,
      },
    });
  } else {
    res.status(401).json({ error: "No active session" });
  }
}

// Update session data
export function updateSession(req: Request,
```typescript
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import { randomBytes } from "crypto";

const app = express();

// Configure session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Extend Express Session type to include custom properties
declare global {
  namespace Express {
    interface Session {
      userId?: string;
      userName?: string;
      loginTime?: Date;
      permissions?: string[];
      metadata?: Record<string, unknown>;
    }
  }
}

// Session initialization middleware
export const initializeSession = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.session.metadata) {
    req.session.metadata = {
      createdAt: new Date(),
      lastActivity: new Date(),
      requestCount: 0,
    };
  }

  const metadata = req.session.metadata as Record<string, unknown>;
  metadata.lastActivity = new Date();
  if (typeof metadata.requestCount === "number") {
    metadata.requestCount++;
  }

  next();
};

// User login handler
export const handleUserLogin = (req: Request, res: Response) => {
  const { username, password } = req.body;

  // Simple validation (in production, verify against database)
  if (!username || !password) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  // Simulate authentication
  const userId = randomBytes(8).toString("hex");

  req.session.userId = userId;
  req.session.userName = username;
  req.session.loginTime = new Date();
  req.session.permissions = ["read", "write"];

  req.session.save((err) => {
    if (err) {
      return res.status(500).json({ error: "Session save failed" });
    }
    res.json({
      success: true,
      message: "Login successful",
      sessionId: req.sessionID,
    });
  });
};

// Session validation middleware
export const validateSession = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Session not authenticated" });
  }

  const loginTime = req.session.loginTime
    ? new Date(req.session.loginTime).getTime()
    : 0;
  const now = Date.now();
  const sessionAge = now - loginTime;

  // Check if session is older than 24 hours
  if (sessionAge > 24 * 60 * 60 * 1000) {
    return res.status(401).json({ error: "Session expired" });
  }

  next();
};

// Permission checker middleware
export const requirePermission = (requiredPerm: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const permissions = req.session.permissions || [];
    if (!permissions.includes(requiredPerm)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
};

// Get session info endpoint
export const getSessionInfo = (req: Request, res: Response) => {
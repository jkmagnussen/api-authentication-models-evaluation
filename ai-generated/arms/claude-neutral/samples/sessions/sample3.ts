```typescript
import express, { Request, Response } from "express";
import session from "express-session";
import crypto from "crypto";

const app = express();

// Session configuration with memory store
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-this",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  })
);

app.use(express.json());

// Extend Express Session to include custom fields
declare global {
  namespace Express {
    interface Session {
      userId?: string;
      userName?: string;
      roles?: string[];
      loginTime?: number;
      activityLog?: Array<{ action: string; timestamp: number }>;
    }
  }
}

export const loginHandler = (req: Request, res: Response): void => {
  const { username, password } = req.body;

  // Simulate authentication
  if (username && password === "demo123") {
    req.session.userId = crypto.randomUUID();
    req.session.userName = username;
    req.session.roles = ["user"];
    req.session.loginTime = Date.now();
    req.session.activityLog = [
      { action: "login", timestamp: Date.now() },
    ];

    res.json({
      success: true,
      message: "Login successful",
      sessionId: req.sessionID,
    });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
};

export const logoutHandler = (req: Request, res: Response): void => {
  const userName = req.session.userName;

  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ success: false, message: "Logout failed" });
      return;
    }
    res.json({
      success: true,
      message: `Goodbye ${userName}`,
    });
  });
};

export const getCurrentSessionHandler = (req: Request, res: Response): void => {
  if (!req.session.userId) {
    res.status(401).json({ authenticated: false });
    return;
  }

  res.json({
    authenticated: true,
    userId: req.session.userId,
    userName: req.session.userName,
    roles: req.session.roles,
    sessionDuration:
      Date.now() - (req.session.loginTime || 0),
    activityCount: req.session.activityLog?.length || 0,
  });
};

export const updateActivityHandler = (req: Request, res: Response): void => {
  if (!req.session.userId) {
    res.status(401).json({ success: false, message: "Not authenticated" });
    return;
  }

  const { action } = req.body;

  if (!req.session.activityLog) {
    req.session.activityLog = [];
  }

  req.session.activityLog.push({
    action,
    timestamp: Date.now(),
  });

  res.json({
    success: true,
    message: "Activity logged",
    totalActivities: req.session.activityLog.length,
  });
};

export const regenerateSessionHandler = (req: Request, res: Response): void => {
  const currentUserId = req.session.userId;
  const currentUserName = req.session.userName;

  req.session.regenerate((
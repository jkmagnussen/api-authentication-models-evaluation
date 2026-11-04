```typescript
import express, { Express, Request, Response } from "express";
import session from "express-session";
import { v4 as uuidv4 } from "uuid";

interface SessionData {
  userId?: string;
  username?: string;
  loginTime?: Date;
  lastActivity?: Date;
}

declare global {
  namespace Express {
    interface Request {
      session: session.Session & Partial<SessionData>;
    }
  }
}

const app: Express = express();

// Configure session middleware
app.use(
  session({
    secret: "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use(express.json());

// Session storage for demo purposes
interface StoredSession {
  userId: string;
  username: string;
  loginTime: Date;
  lastActivity: Date;
}

const sessionStore: Map<string, StoredSession> = new Map();

export const loginUser = (req: Request, res: Response): void => {
  const { username, password } = req.body;

  // Simple validation (in production, verify against database)
  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

  // Simulate user authentication
  const userId = uuidv4();
  const now = new Date();

  // Store in session
  req.session.userId = userId;
  req.session.username = username;
  req.session.loginTime = now;
  req.session.lastActivity = now;

  // Store in memory for demo
  sessionStore.set(userId, {
    userId,
    username,
    loginTime: now,
    lastActivity: now,
  });

  req.session.save((err) => {
    if (err) {
      res.status(500).json({ error: "Failed to save session" });
      return;
    }
    res.json({
      message: "Login successful",
      sessionId: req.sessionID,
      userId,
      username,
    });
  });
};

export const logoutUser = (req: Request, res: Response): void => {
  if (req.session.userId) {
    const userId = req.session.userId;
    sessionStore.delete(userId);
  }

  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Failed to logout" });
      return;
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Logout successful" });
  });
};

export const getSessionInfo = (req: Request, res: Response): void => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  // Update last activity
  req.session.lastActivity = new Date();

  req.session.save((err) => {
    if (err) {
      res.status(500).json({ error: "Failed to update session" });
      return;
    }

    res.json({
      sessionId: req.sessionID,
      userId: req.session.userId,
      username: req.session.username,
      loginTime: req.session.loginTime,
      lastActivity: req.session.lastActivity,
    });
  });
};

export const getAllSessions = (_req: Request, res: Response): void => {
  const
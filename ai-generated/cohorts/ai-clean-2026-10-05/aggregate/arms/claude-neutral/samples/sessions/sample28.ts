```typescript
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import { v4 as uuidv4 } from "uuid";

declare global {
  namespace Express {
    interface Request {
      sessionID: string;
    }
  }
}

const app = express();

// In-memory session store for demonstration
const sessionStore = new Map<string, Record<string, unknown>>();

// Session middleware configuration
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  })
);

app.use(express.json());

// Initialize session data
export const initializeSession = (req: Request, res: Response): void => {
  if (!req.session) {
    req.session = {
      userId: undefined,
      userName: undefined,
      loginTime: undefined,
      visits: 0,
    };
  }

  if (!req.session.visits) {
    req.session.visits = 0;
  }
  req.session.visits = (req.session.visits as number) + 1;
};

// Login handler
export const handleLogin = (req: Request, res: Response): void => {
  const { username, password } = req.body;

  // Simple validation (in production, verify against database)
  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: "Invalid credentials" });
    return;
  }

  if (req.session) {
    req.session.userId = uuidv4();
    req.session.userName = username;
    req.session.loginTime = new Date().toISOString();
    req.session.isAuthenticated = true;

    sessionStore.set(req.sessionID, {
      userId: req.session.userId,
      userName: req.session.userName,
      loginTime: req.session.loginTime,
      isAuthenticated: true,
    });
  }

  res.json({
    message: `Welcome ${username}!`,
    sessionId: req.sessionID,
  });
};

// Logout handler
export const handleLogout = (req: Request, res: Response): void => {
  if (req.session) {
    const sessionId = req.sessionID;
    sessionStore.delete(sessionId);
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ error: "Failed to logout" });
        return;
      }
      res.json({ message: "Logged out successfully" });
    });
  } else {
    res.json({ message: "No active session" });
  }
};

// Get session info
export const getSessionInfo = (req: Request, res: Response): void => {
  if (!req.session || !req.session.isAuthenticated) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  res.json({
    sessionId: req.sessionID,
    userId: req.session.userId,
    userName: req.session.userName,
    loginTime: req.session.loginTime,
    visits: req.session.visits,
  });
};

// Update session data
export const updateSessionData = (req: Request, res: Response
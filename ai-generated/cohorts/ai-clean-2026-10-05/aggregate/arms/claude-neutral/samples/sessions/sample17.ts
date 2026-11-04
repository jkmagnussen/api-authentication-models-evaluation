```typescript
import express, { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { v4 as uuidv4 } from "uuid";

const app: Express = express();
const PORT = 3000;

// Configure session middleware
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Type definitions for session data
declare global {
  namespace Express {
    interface Request {
      session: session.Session & {
        userId?: string;
        username?: string;
        loginTime?: Date;
        data?: Record<string, unknown>;
      };
    }
  }
}

// Middleware to check if user is authenticated
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Unauthorized - Please login first" });
    return;
  }
  next();
};

// Middleware to log session info
export const logSessionInfo = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.log(`[Session] ID: ${req.sessionID}, User: ${req.session.userId}`);
  next();
};

// Route to login and create session
export const loginHandler = (req: Request, res: Response): void => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

  // Simple validation (in production, verify against database)
  if (password.length < 3) {
    res.status(400).json({ error: "Invalid credentials" });
    return;
  }

  req.session.userId = uuidv4();
  req.session.username = username;
  req.session.loginTime = new Date();
  req.session.data = {
    role: "user",
    preferences: {
      theme: "light",
    },
  };

  res.json({
    message: "Login successful",
    sessionId: req.sessionID,
    user: {
      userId: req.session.userId,
      username: req.session.username,
      loginTime: req.session.loginTime,
    },
  });
};

// Route to get session info
export const getSessionHandler = (req: Request, res: Response): void => {
  if (!req.session.userId) {
    res.status(401).json({ error: "No active session" });
    return;
  }

  res.json({
    sessionId: req.sessionID,
    user: {
      userId: req.session.userId,
      username: req.session.username,
      loginTime: req.session.loginTime,
    },
    data: req.session.data,
  });
};

// Route to update session data
export const updateSessionHandler = (req: Request, res: Response): void => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { key, value } = req.
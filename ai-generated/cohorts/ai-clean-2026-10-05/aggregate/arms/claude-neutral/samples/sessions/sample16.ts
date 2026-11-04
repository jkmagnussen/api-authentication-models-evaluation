```typescript
import express, { Request, Response } from "express";
import session from "express-session";

export const app = express();

// Session configuration
const sessionConfig = session({
  secret: "your-secret-key-change-in-production",
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, // Set to true if using HTTPS
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    httpOnly: true,
  },
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sessionConfig);

// Extend Express Session type
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

// Login route
export const login = (req: Request, res: Response): void => {
  const { username, password } = req.body;

  // Simple authentication (in production, verify against database)
  if (username && password === "password123") {
    req.session.userId = "user-" + Date.now();
    req.session.username = username;
    req.session.loginTime = new Date();
    req.session.isAuthenticated = true;

    res.json({
      message: "Login successful",
      sessionId: req.sessionID,
      user: {
        userId: req.session.userId,
        username: req.session.username,
      },
    });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
};

// Logout route
export const logout = (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ message: "Failed to logout" });
    } else {
      res.json({ message: "Logout successful" });
    }
  });
};

// Get session info route
export const getSessionInfo = (req: Request, res: Response): void => {
  if (req.session.isAuthenticated) {
    res.json({
      message: "Session active",
      sessionId: req.sessionID,
      user: {
        userId: req.session.userId,
        username: req.session.username,
      },
      loginTime: req.session.loginTime,
      sessionExpiry: new Date(
        Date.now() + (1000 * 60 * 60 * 24)
      ).toISOString(),
    });
  } else {
    res.status(401).json({ message: "No active session" });
  }
};

// Update session data route
export const updateSession = (req: Request, res: Response): void => {
  if (!req.session.isAuthenticated) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  const { username } = req.body;
  if (username) {
    req.session.username = username;
    res.json({
      message: "Session updated",
      user: {
        userId: req.session.userId,
        username: req.session.username,
      },
    });
  } else {
    res.status(400).json({ message: "Username required" });
  }
};

// Middleware to check authentication
export const requireAuth = (
  req: Request,
  res: Response,
  next: Function
): void => {
  if (req.session.isAuthenticated) {
    next();
  } else {
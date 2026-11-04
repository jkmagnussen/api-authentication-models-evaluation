```typescript
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";

declare global {
  namespace Express {
    interface Request {
      session: session.Session & Partial<session.SessionData> & {
        userId?: string;
        username?: string;
        loginTime?: Date;
        isAuthenticated?: boolean;
      };
    }
  }
}

export const app = express();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
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

// Middleware to check if user is authenticated
export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.session && req.session.isAuthenticated) {
    next();
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
};

// Login route
export const login = (req: Request, res: Response) => {
  const { username, password } = req.body;

  // Simple validation (in production, validate against database)
  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

  // Simulate user authentication
  if (password === "demo123") {
    req.session.userId = Math.random().toString(36).substr(2, 9);
    req.session.username = username;
    req.session.loginTime = new Date();
    req.session.isAuthenticated = true;

    req.session.save((err) => {
      if (err) {
        res.status(500).json({ error: "Session save failed" });
        return;
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
};

// Get current session info
export const getSession = (req: Request, res: Response) => {
  if (req.session && req.session.isAuthenticated) {
    res.json({
      userId: req.session.userId,
      username: req.session.username,
      loginTime: req.session.loginTime,
      sessionId: req.sessionID,
    });
  } else {
    res.status(401).json({ error: "No active session" });
  }
};

// Logout route
export const logout = (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Logout failed" });
      return;
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Logout successful" });
  });
};

// Protected route example
export const protectedRoute = (req: Request, res: Response) => {
  res.json({
    message: `Hello ${req.session.username}, you have access to protected content`,
    sessionData: {
      userId: req.session.userId,
      loginTime: req.session.loginTime,
    },
  });
};

// Update session data
export const updateSession = (req:
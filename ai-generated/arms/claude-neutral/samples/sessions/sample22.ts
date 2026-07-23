```typescript
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";

// Custom session data interface
interface CustomSessionData {
  userId?: string;
  email?: string;
  role?: "admin" | "user";
  loginTime?: Date;
  authenticated?: boolean;
}

// Extend Express session to include our custom data
declare global {
  namespace Express {
    interface Session extends CustomSessionData {}
  }
}

// Initialize Express app
const app = express();
app.use(express.json());

// Configure session management
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-prod",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      sameSite: "strict",
    },
  })
);

// Middleware to check if user is authenticated
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.session.authenticated) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
};

// Middleware to check if user is admin
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.session.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
};

// Simulate user database
const users = new Map([
  [
    "user1",
    {
      id: "user1",
      email: "user1@example.com",
      password: "pass123",
      role: "user" as const,
    },
  ],
  [
    "admin1",
    {
      id: "admin1",
      email: "admin@example.com",
      password: "admin123",
      role: "admin" as const,
    },
  ],
]);

// Login endpoint
export const handleLogin = (req: Request, res: Response): void => {
  const { username, password } = req.body;

  const user = users.get(username);
  if (!user || user.password !== password) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  // Set session data
  req.session.userId = user.id;
  req.session.email = user.email;
  req.session.role = user.role;
  req.session.loginTime = new Date();
  req.session.authenticated = true;

  res.json({ success: true, message: "Logged in successfully" });
};

app.post("/login", handleLogin);

// Logout endpoint
export const handleLogout = (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Failed to logout" });
      return;
    }
    res.json({ success: true, message: "Logged out successfully" });
  });
};

app.post("/logout", handleLogout);

// Get current session info
export const getSessionInfo = (req: Request, res: Response): void => {
  if (!req.session.authenticated) {
    res.status(401).json({ error: "No active session" });
    return;
  }

  res.json({
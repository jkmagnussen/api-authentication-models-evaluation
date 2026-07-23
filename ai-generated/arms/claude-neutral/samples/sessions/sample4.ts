```typescript
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import { randomBytes } from "crypto";

declare global {
  namespace Express {
    interface Request {
      session: session.Session & Partial<SessionData>;
    }
  }
}

interface SessionData {
  userId: string;
  username: string;
  loginTime: number;
  lastActivity: number;
  roles: string[];
}

const app = express();

const generateSessionSecret = (): string => {
  return randomBytes(32).toString("hex");
};

const sessionConfig = {
  secret: generateSessionSecret(),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24,
    sameSite: "lax" as const,
  },
};

app.use(session(sessionConfig));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Unauthorized - please log in" });
    return;
  }

  req.session.lastActivity = Date.now();
  next();
};

export const requireRole =
  (requiredRoles: string[]) =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userRoles = req.session.roles || [];
    const hasRequiredRole = requiredRoles.some((role) =>
      userRoles.includes(role)
    );

    if (!hasRequiredRole) {
      res.status(403).json({ error: "Forbidden - insufficient permissions" });
      return;
    }

    next();
  };

export const handleLogin = (req: Request, res: Response): void => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

  if (password === "correctPassword") {
    req.session.userId = `user_${Date.now()}`;
    req.session.username = username;
    req.session.loginTime = Date.now();
    req.session.lastActivity = Date.now();
    req.session.roles = ["user"];

    if (username === "admin") {
      req.session.roles = ["admin", "user"];
    }

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: req.session.userId,
        username: req.session.username,
        roles: req.session.roles,
      },
    });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
};

export const handleLogout = (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Logout failed" });
      return;
    }
    res.json({ success: true, message: "Logged out successfully" });
  });
};

export const getSessionInfo = (req: Request, res: Response): void => {
  if (!req.session.userId) {
    res.status(401).json
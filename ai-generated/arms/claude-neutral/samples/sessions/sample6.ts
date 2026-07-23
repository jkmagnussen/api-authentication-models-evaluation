```typescript
import express, { Express, Request, Response } from "express";
import session from "express-session";

const app: Express = express();

// Configure session middleware
app.use(
  session({
    secret: "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Type definitions for session data
declare global {
  namespace Express {
    interface Session {
      userId?: string;
      username?: string;
      roles?: string[];
      loginTime?: Date;
      lastActivity?: Date;
      preferences?: {
        theme?: string;
        language?: string;
      };
    }
  }
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

// Middleware to update last activity timestamp
export const updateActivityTimestamp = (
  req: Request,
  res: Response,
  next: Function
) => {
  if (req.session) {
    req.session.lastActivity = new Date();
  }
  next();
};

// Middleware to check if user is authenticated
export const requireAuthMiddleware = (
  req: Request,
  res: Response,
  next: Function
) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
};

// Middleware to check user roles
export const checkRoleMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: Function) => {
    const userRoles = req.session.roles || [];
    const hasRole = allowedRoles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
};

app.use(updateActivityTimestamp);

// Login endpoint
export const loginEndpoint = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { username, password } = req.body;

  // Mock authentication
  if (username === "admin" && password === "admin123") {
    const userProfile: UserProfile = {
      id: "user-001",
      name: "Administrator",
      email: "admin@example.com",
      roles: ["admin", "user"],
    };

    req.session.userId = userProfile.id;
    req.session.username = username;
    req.session.roles = userProfile.roles;
    req.session.loginTime = new Date();
    req.session.preferences = {
      theme: "dark",
      language: "en",
    };

    res.json({
      message: "Login successful",
      user: {
        id: userProfile.id,
        username: userProfile.name,
        roles: userProfile.roles,
      },
    });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
};

// Get current session info
export const getSessionInfoEndpoint = (
  req: Request,
  res: Response
): void => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  res.json({
    userId
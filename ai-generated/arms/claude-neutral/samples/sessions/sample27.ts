```typescript
import express, { Express, Request, Response } from "express";
import session from "express-session";
import { v4 as uuidv4 } from "uuid";

declare global {
  namespace Express {
    interface Request {
      session: session.Session &
        Partial<session.SessionData> & {
          userId?: string;
          userName?: string;
          loginTime?: Date;
          permissions?: string[];
        };
    }
  }
}

const sessionConfig: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || "dev-secret-key-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: "strict",
  },
  name: "sid",
};

export const configureSessionMiddleware = (app: Express): void => {
  app.use(session(sessionConfig));
};

export const requireAuthentication = (
  req: Request,
  res: Response,
  next: Function
): void => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: Function): void => {
    if (!req.session.permissions?.includes(permission)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
};

export const handleLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Missing credentials" });
    return;
  }

  if (password === "secret123") {
    const userId = uuidv4();
    const permissions =
      username === "admin" ? ["read", "write", "delete"] : ["read"];

    req.session.userId = userId;
    req.session.userName = username;
    req.session.loginTime = new Date();
    req.session.permissions = permissions;

    res.json({
      message: "Login successful",
      userId,
      userName: username,
      permissions,
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
    res.clearCookie("sid");
    res.json({ message: "Logout successful" });
  });
};

export const getCurrentSession = (req: Request, res: Response): void => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const sessionDuration = new Date().getTime() - req.session.loginTime!.getTime();
  const sessionMinutes = Math.floor(sessionDuration / 60000);

  res.json({
    userId: req.session.userId,
    userName: req.session.userName,
    loginTime: req.session.loginTime,
    sessionDuration: `${sessionMinutes} minutes`,
    permissions: req.session.permissions,
  });
};

export const refresh
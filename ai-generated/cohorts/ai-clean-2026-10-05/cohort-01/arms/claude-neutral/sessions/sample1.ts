```typescript
import express, { Express, Request, Response } from "express";
import session from "express-session";
import { v4 as uuidv4 } from "uuid";

declare global {
  namespace Express {
    interface Session {
      userId?: string;
      username?: string;
      loginTime?: Date;
      visitCount?: number;
    }
  }
}

export const createSessionMiddleware = () => {
  return session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  });
};

export const loginHandler = (req: Request, res: Response): void => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

  if (password !== "demo-password") {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  req.session.userId = uuidv4();
  req.session.username = username;
  req.session.loginTime = new Date();
  req.session.visitCount = 1;

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
};

export const logoutHandler = (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Logout failed" });
      return;
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Logout successful" });
  });
};

export const getSessionHandler = (req: Request, res: Response): void => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  if (req.session.visitCount) {
    req.session.visitCount++;
  } else {
    req.session.visitCount = 1;
  }

  req.session.save((err) => {
    if (err) {
      res.status(500).json({ error: "Session update failed" });
      return;
    }
    res.json({
      userId: req.session.userId,
      username: req.session.username,
      loginTime: req.session.loginTime,
      visitCount: req.session.visitCount,
    });
  });
};

export const isAuthenticatedMiddleware = (
  req: Request,
  res: Response,
  next: Function
): void => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
};

export const setupSessionRoutes = (app: Express): void => {
  app.post("/login", express.json(), loginHandler);
  app.post("/logout", logoutHandler);
  app.get("/session", isAuthenticatedMiddleware, getSessionHandler);
  app.get("/protected", isAuthenticatedMiddleware, (req: Request,
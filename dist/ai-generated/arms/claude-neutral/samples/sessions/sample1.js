"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
`` `typescript
import express, { Express, Request, Response } from "express";
import session from "express-session";
import { randomBytes } from "crypto";

declare global {
  namespace Express {
    interface Session {
      userId?: string;
      username?: string;
      loginTime?: Date;
      ipAddress?: string;
    }
  }
}

const app: Express = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const sessionConfig = session({
  secret: process.env.SESSION_SECRET || "ultra-secret-key-change-in-prod",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: "strict" as const,
  },
  name: "sessionId",
});

app.use(sessionConfig);

export const loginHandler = (req: Request, res: Response): void => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

  if (password === "demo-password") {
    req.session.userId = randomBytes(8).toString("hex");
    req.session.username = username;
    req.session.loginTime = new Date();
    req.session.ipAddress = req.ip;

    res.json({
      message: "Login successful",
      sessionId: req.sessionID,
      userId: req.session.userId,
    });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
};

export const getCurrentUserHandler = (req: Request, res: Response): void => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  res.json({
    userId: req.session.userId,
    username: req.session.username,
    loginTime: req.session.loginTime,
    sessionId: req.sessionID,
  });
};

export const logoutHandler = (req: Request, res: Response): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Failed to logout" });
      return;
    }
    res.clearCookie("sessionId");
    res.json({ message: "Logout successful" });
  });
};

export const sessionStatusHandler = (req: Request, res: Response): void => {
  if (req.session.userId) {
    res.json({
      authenticated: true,
      username: req.session.username,
      sessionDuration: req.session.loginTime
        ? Date.now() - req.session.loginTime.getTime()
        : 0,
    });
  } else {
    res.json({ authenticated: false });
  }
};

export const updateProfileHandler = (req: Request, res: Response): void => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const { newUsername } = req.body;
  if (newUsername) {
    req.session.username = newUsername;
  }

  req.session.save((err) => {
    if (err) {
      res.status(500).json({ error: "Failed to update profile" });
      return;
    }
    res.json({ message: "Profile updated", username:;

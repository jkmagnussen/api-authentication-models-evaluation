```typescript
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import { randomBytes } from "crypto";

interface SessionData {
  userId?: string;
  loginTimestamp?: number;
  ipAddress?: string;
}

declare global {
  namespace Express {
    interface Request {
      session: session.Session & Partial<SessionData>;
    }
  }
}

const createSessionMiddleware = () => {
  return session({
    secret: process.env.SESSION_SECRET || randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    name: "_secure_sid",
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "strict" as const,
      maxAge: 15 * 60 * 1000,
      domain: process.env.COOKIE_DOMAIN,
    },
    store: new session.MemoryStore(),
  });
};

const validateSessionIntegrity = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.session.userId) {
    return next();
  }

  const currentIp = req.ip || req.connection.remoteAddress || "";
  if (req.session.ipAddress && req.session.ipAddress !== currentIp) {
    return res.status(401).json({ error: "Session IP mismatch" });
  }

  next();
};

const enforceSessionTimeout = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.session.userId && req.session.loginTimestamp) {
    const sessionAge = Date.now() - req.session.loginTimestamp;
    const maxAge = 15 * 60 * 1000;

    if (sessionAge > maxAge) {
      req.session.destroy((err) => {
        if (err) console.error("Session destruction error:", err);
      });
      return res.status(401).json({ error: "Session expired" });
    }
  }

  next();
};

export const performLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Missing credentials" });
    return;
  }

  if (username !== "validuser" || password !== "validpass") {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  req.session.regenerate((err) => {
    if (err) {
      res.status(500).json({ error: "Session regeneration failed" });
      return;
    }

    req.session.userId = `user_${username}`;
    req.session.loginTimestamp = Date.now();
    req.session.ipAddress = req.ip || req.connection.remoteAddress || "";

    req.session.save((saveErr) => {
      if (saveErr) {
        res.status(500).json({ error: "Failed to save session" });
        return;
      }

      res.status(200).json({
        message: "Login successful",
        sessionId: req.sessionID,
      });
    });
  });
};

export const performLogout = (req: Request, res: Response): void => {
  const sessionId = req.sessionID;

  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Logout failed"
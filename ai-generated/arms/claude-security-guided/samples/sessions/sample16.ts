```typescript
import express, { Request, Response, NextFunction } from "express";
import session, { SessionOptions } from "express-session";
import { randomBytes } from "crypto";

export const createSecureSessionMiddleware = () => {
  const sessionConfig: SessionOptions = {
    secret: process.env.SESSION_SECRET || randomBytes(32).toString("hex"),
    name: "sid",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24,
      path: "/",
      domain: process.env.SESSION_DOMAIN,
    },
  };

  return session(sessionConfig);
};

export const validateSessionIntegrity = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.session) {
    return res.status(401).json({ error: "Session unavailable" });
  }

  const now = Date.now();
  const sessionCreatedAt = (req.session as any).createdAt || now;
  const maxSessionAge = 1000 * 60 * 60 * 24;

  if (now - sessionCreatedAt > maxSessionAge) {
    req.session.destroy(() => {
      return res.status(401).json({ error: "Session expired" });
    });
    return;
  }

  next();
};

export const performSessionRegeneration = (
  req: Request
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const originalSessionData = { ...req.session };

    req.session.regenerate((err) => {
      if (err) {
        reject(new Error(`Session regeneration failed: ${err.message}`));
        return;
      }

      Object.assign(req.session, originalSessionData);

      (req.session as any).regeneratedAt = Date.now();
      (req.session as any).createdAt = Date.now();

      req.session.save((saveErr) => {
        if (saveErr) {
          reject(new Error(`Session save failed: ${saveErr.message}`));
          return;
        }
        resolve(true);
      });
    });
  });
};

export const handleLogout = (req: Request, res: Response): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!req.session) {
      resolve();
      return;
    }

    const sessionId = req.sessionID;

    req.session.destroy((err) => {
      if (err) {
        reject(new Error(`Session destruction failed: ${err.message}`));
        return;
      }

      res.clearCookie("sid", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      console.log(`Session ${sessionId} invalidated successfully`);
      resolve();
    });
  });
};

export const enforceSessionBinding = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const session = req.session as any;

  if (!session.userAgent) {
    session.userAgent = req.get("user-agent") || "unknown";
    session.ipAddress = req.ip || "unknown";
    return next();
  }

  const currentUserAgent = req.get("user-agent") || "unknown";
  const currentIpAddress = req.ip || "unknown";

  if
```typescript
import express, { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import crypto from "crypto";

export function initializeSecureSession(app: Express): void {
  const sessionConfig = session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    name: "auth.token",
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "strict" as const,
      maxAge: 30 * 60 * 1000,
      domain: process.env.COOKIE_DOMAIN,
    },
  });

  app.use(sessionConfig);
}

export async function authenticateUser(
  req: Request,
  res: Response,
  userId: string
): Promise<void> {
  if (!req.session) {
    throw new Error("Session not available");
  }

  const validateUserId = (id: string): boolean => {
    return /^[a-zA-Z0-9_-]{3,32}$/.test(id);
  };

  if (!validateUserId(userId)) {
    throw new Error("Invalid user ID format");
  }

  req.session.userId = userId;
  req.session.loginTime = Date.now();
  req.session.ipAddress = req.ip;
  req.session.userAgent = req.get("user-agent") || "";

  await new Promise<void>((resolve, reject) => {
    req.session!.regenerate((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export async function verifySessionIntegrity(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.session || !req.session.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const currentIp = req.ip;
  const currentUserAgent = req.get("user-agent") || "";

  if (
    req.session.ipAddress !== currentIp ||
    req.session.userAgent !== currentUserAgent
  ) {
    await new Promise<void>((resolve) => {
      req.session!.destroy(() => {
        resolve();
      });
    });

    res.status(401).json({ error: "Session validation failed" });
    return;
  }

  const sessionAge = Date.now() - (req.session.loginTime || 0);
  if (sessionAge > 2 * 60 * 60 * 1000) {
    await new Promise<void>((resolve) => {
      req.session!.destroy(() => {
        resolve();
      });
    });

    res.status(401).json({ error: "Session expired" });
    return;
  }

  next();
}

export async function terminateSession(req: Request, res: Response): Promise<void> {
  if (!req.session) {
    res.status(400).json({ error: "No active session" });
    return;
  }

  const sessionId = req.sessionID;

  await new Promise<void>((resolve, reject) => {
    req.session!.destroy((err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  res.clearCookie("auth.token", {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "strict",
    domain: process.env.
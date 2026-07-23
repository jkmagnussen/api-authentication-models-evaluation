```typescript
import express, { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import crypto from "crypto";

declare global {
  namespace Express {
    interface Request {
      sessionID: string;
      session: session.Session & {
        userId?: string;
        loginTimestamp?: number;
        ipAddress?: string;
      };
    }
  }
}

export function initializeSecureSessionMiddleware(): express.RequestHandler {
  return session({
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
    name: "sid",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "strict",
      maxAge: 1000 * 60 * 30,
      domain: process.env.COOKIE_DOMAIN,
    },
    genid: (req: Request): string => {
      return crypto.randomBytes(16).toString("hex");
    },
  });
}

export async function performSessionRegeneration(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    const previousSessionId = req.sessionID;
    req.session.regenerate((err: Error | null) => {
      if (err) {
        reject(new Error(`Session regeneration failed: ${err.message}`));
        return;
      }
      req.session.loginTimestamp = Date.now();
      req.session.ipAddress = extractClientIpAddress(req);
      resolve();
    });
  });
}

export async function validateSessionIntegrity(
  req: Request
): Promise<{ isValid: boolean; reason?: string }> {
  if (!req.session || !req.session.userId) {
    return { isValid: false, reason: "No active session" };
  }

  const sessionIpAddress = req.session.ipAddress;
  const currentIpAddress = extractClientIpAddress(req);

  if (sessionIpAddress && sessionIpAddress !== currentIpAddress) {
    return {
      isValid: false,
      reason: "IP address mismatch detected",
    };
  }

  const sessionAge = Date.now() - (req.session.loginTimestamp || 0);
  const maxSessionAge = 1000 * 60 * 30;

  if (sessionAge > maxSessionAge) {
    return { isValid: false, reason: "Session expired" };
  }

  return { isValid: true };
}

export async function executeSessionLogout(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    const sessionIdToInvalidate = req.sessionID;

    req.session.destroy((err: Error | null) => {
      if (err) {
        reject(new Error(`Session destruction failed: ${err.message}`));
        return;
      }
      resolve();
    });
  });
}

export function protectedRouteMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.session || !req.session.userId) {
    res.status(401).json({ error: "Unauthorized: No active session" });
    return;
  }

  next();
}

export async function enforceSessionRefresh(
  req: Request,
  thresholdMs: number = 1000 * 60 * 15
): Promise<void> {
  const lastLoginTime = req.session.loginTimestamp || 0;
  const timeSinceLogin = Date.now() - last
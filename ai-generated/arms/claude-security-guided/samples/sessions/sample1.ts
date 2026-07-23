```typescript
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import crypto from "crypto";

const app = express();

interface SessionRequest extends Request {
  sessionID?: string;
  sessionRegenerateTime?: number;
}

const SESSION_REGENERATION_INTERVAL = 15 * 60 * 1000; // 15 minutes
const SESSION_MAX_AGE = 60 * 60 * 1000; // 1 hour
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");

export function initializeSecureSessionMiddleware(
  expressApp: express.Application
): void {
  expressApp.use(
    session({
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      name: "sid",
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "strict",
        maxAge: SESSION_MAX_AGE,
        path: "/",
      },
      genid: () => crypto.randomUUID(),
    })
  );
}

export async function regenerateSessionIfNeeded(
  req: SessionRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const now = Date.now();
  const lastRegen = req.sessionRegenerateTime || 0;

  if (now - lastRegen > SESSION_REGENERATION_INTERVAL) {
    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration error:", err);
        return res.status(500).json({ error: "Session error" });
      }
      req.sessionRegenerateTime = now;
      next();
    });
  } else {
    next();
  }
}

export function handleAuthenticationLogin(
  req: SessionRequest,
  res: Response
): void {
  const userId = req.body?.userId;
  const userEmail = req.body?.userEmail;

  if (!userId || !userEmail) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  req.session.regenerate((err) => {
    if (err) {
      console.error("Session creation error:", err);
      return res.status(500).json({ error: "Authentication failed" });
    }

    req.session.userId = userId;
    req.session.userEmail = userEmail;
    req.session.authenticatedAt = Date.now();
    req.sessionRegenerateTime = Date.now();

    res.json({
      message: "Login successful",
      sessionId: req.sessionID,
    });
  });
}

export function handleLogoutInvalidation(
  req: SessionRequest,
  res: Response
): void {
  const sessionToDestroy = req.session;

  sessionToDestroy.destroy((err) => {
    if (err) {
      console.error("Session destruction error:", err);
      return res.status(500).json({ error: "Logout failed" });
    }

    res.clearCookie("sid", {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "strict",
    });

    res.json({ message: "Logout successful" });
  });
}

export function validateActiveSession(
  req: SessionRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Session not
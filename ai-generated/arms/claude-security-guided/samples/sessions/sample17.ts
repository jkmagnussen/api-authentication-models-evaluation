```typescript
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import cookieParser from "cookie-parser";

const app = express();

// Explicit validation constants
const SESSION_CONFIG = {
  secret: process.env.SESSION_SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "strict" as const,
    maxAge: 1000 * 60 * 60, // 1 hour
  },
} as const;

// Middleware setup
app.use(cookieParser());
app.use(
  session({
    ...SESSION_CONFIG,
    store: new session.MemoryStore(),
  })
);

// Request augmentation for TypeScript
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      isAuthenticated?: boolean;
    }
  }
}

export const validateSessionId = (sessionId: string): boolean => {
  return typeof sessionId === "string" && sessionId.length > 0;
};

export const initiateUserSession = async (
  req: Request,
  userId: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) {
        reject(new Error("Session regeneration failed"));
        return;
      }

      req.session.userId = userId;
      req.session.createdAt = new Date();
      req.session.ipAddress = req.ip;
      req.session.userAgent = req.get("user-agent") || "";

      req.session.save((err) => {
        if (err) {
          reject(new Error("Session save failed"));
          return;
        }
        resolve();
      });
    });
  });
};

export const validateSessionIntegrity = (req: Request): boolean => {
  if (!req.session.userId) {
    return false;
  }

  const storedIp = req.session.ipAddress;
  const currentIp = req.ip;

  if (storedIp && storedIp !== currentIp) {
    return false;
  }

  const storedUserAgent = req.session.userAgent;
  const currentUserAgent = req.get("user-agent") || "";

  if (storedUserAgent && storedUserAgent !== currentUserAgent) {
    return false;
  }

  return true;
};

export const terminateUserSession = async (req: Request): Promise<void> => {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) {
        reject(new Error("Session destruction failed"));
        return;
      }

      req.clearCookie("connect.sid", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      resolve();
    });
  });
};

export const refreshSessionToken = async (
  req: Request
): Promise<string | null> => {
  if (!req.session.userId) {
    return null;
  }

  const currentUserId = req.session.userId;

  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) {
        reject(new Error("Session refresh failed"));
        return;
      }

      req.session.userId = currentUserId;
      req.session.refreshedAt = new Date();
      req.session.ipAddress
```typescript
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import crypto from "crypto";

const app = express();

const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
const SESSION_MAX_AGE = 1000 * 60 * 60; // 1 hour
const SESSION_NAME = "sessionId";

interface SessionData {
  userId?: string;
  username?: string;
  role?: string;
  loginTime?: number;
  ip?: string;
  userAgent?: string;
}

declare global {
  namespace Express {
    interface Session {
      data?: SessionData;
      regenerate?: (callback: (err?: Error) => void) => void;
      destroy?: (callback: (err?: Error) => void) => void;
    }
  }
}

export const configureSession = (
  app: express.Application
): express.Application => {
  app.use(
    session({
      secret: SESSION_SECRET,
      name: SESSION_NAME,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "strict" as const,
        maxAge: SESSION_MAX_AGE,
      },
      store: undefined,
    })
  );

  return app;
};

export const validateSessionInput = (input: unknown): string => {
  if (typeof input !== "string") {
    throw new Error("Invalid input: expected string");
  }

  if (input.length === 0 || input.length > 255) {
    throw new Error("Invalid input: length must be between 1 and 255");
  }

  const sanitized = input.trim().replace(/[^a-zA-Z0-9_-]/g, "");
  if (sanitized !== input.trim()) {
    throw new Error("Invalid input: contains forbidden characters");
  }

  return sanitized;
};

export const validateUserRole = (role: unknown): "admin" | "user" => {
  const validRoles = ["admin", "user"];
  if (!validRoles.includes(role as string)) {
    throw new Error("Invalid role: must be admin or user");
  }
  return role as "admin" | "user";
};

export const createSession = (
  req: Request,
  userId: string,
  username: string,
  role: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const validatedUsername = validateSessionInput(username);
      const validatedRole = validateUserRole(role);

      req.session.data = {
        userId: validateSessionInput(userId),
        username: validatedUsername,
        role: validatedRole,
        loginTime: Date.now(),
        ip: req.ip,
        userAgent: req.get("user-agent") || "unknown",
      };

      req.session.save((err: Error | null) => {
        if (err) {
          reject(new Error("Failed to save session"));
        } else {
          resolve();
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

export const destroySession = (req: Request): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (req.session && req.session.destroy) {
      req.session.destroy((err: Error | null) => {
        if (err) {
          reject(new Error("Failed to destroy session"));
        } else {
          resolve();
        }
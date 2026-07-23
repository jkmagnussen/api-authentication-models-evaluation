```typescript
import express, { Express, Request, Response, NextFunction } from "express";
import session, { SessionOptions } from "express-session";
import crypto from "crypto";

// Initialize Store
interface SessionStore {
  sessions: Map<string, { data: Record<string, unknown>; expiresAt: number }>;
  get(
    sid: string,
    callback: (err: Error | null, session?: Record<string, unknown>) => void
  ): void;
  set(
    sid: string,
    sess: Record<string, unknown>,
    callback?: (err?: Error | null) => void
  ): void;
  destroy(sid: string, callback?: (err?: Error | null) => void): void;
}

const createMemorySessionStore = (): SessionStore => {
  const sessions = new Map<
    string,
    { data: Record<string, unknown>; expiresAt: number }
  >();

  return {
    sessions,
    get(sid: string, callback) {
      const session = sessions.get(sid);
      if (!session) {
        callback(null);
        return;
      }

      if (Date.now() > session.expiresAt) {
        sessions.delete(sid);
        callback(null);
        return;
      }

      callback(null, session.data);
    },
    set(sid: string, sess: Record<string, unknown>, callback) {
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      sessions.set(sid, { data: sess, expiresAt });
      callback?.();
    },
    destroy(sid: string, callback) {
      sessions.delete(sid);
      callback?.();
    },
  };
};

// Validation utilities
export const validateSessionConfig = (config: SessionOptions): boolean => {
  if (!config.secret || config.secret.length < 32) {
    throw new Error("Session secret must be at least 32 characters");
  }
  if (config.cookie?.secure !== true && process.env.NODE_ENV === "production") {
    throw new Error("Secure cookies required in production");
  }
  if (config.cookie?.httpOnly !== true) {
    throw new Error("HttpOnly flag must be enabled");
  }
  return true;
};

export const generateSecureSessionId = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

// Session middleware setup
export const configureSecureSession = (app: Express): void => {
  const sessionSecret =
    process.env.SESSION_SECRET ||
    crypto.randomBytes(32).toString("hex").substring(0, 32);
  if (sessionSecret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters");
  }

  const sessionConfig: SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    name: "session_id",
    genid: () => generateSecureSessionId(),
    store: createMemorySessionStore() as any,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: "/",
      domain:
        process.env.NODE_ENV === "production"
          ? process.env.SESSION_DOMAIN
          : undefined,
    },
  };

  validateSessionConfig(sessionConfig);
  app.use(session(sessionConfig));
};

// Session regeneration
```typescript
import express, { Request, Response } from "express";
import session from "express-session";
import crypto from "crypto";

const app = express();

// In-memory store for sessions (for development purposes)
interface SessionData {
  [key: string]: {
    data: Record<string, unknown>;
    expiresAt: number;
  };
}

const sessionStore: SessionData = {};

// Custom session store implementation
class InMemorySessionStore {
  get(
    sid: string,
    callback: (err: Error | null, session?: Record<string, unknown>) => void
  ) {
    const session = sessionStore[sid];
    if (!session) {
      return callback(null);
    }

    if (session.expiresAt < Date.now()) {
      delete sessionStore[sid];
      return callback(null);
    }

    callback(null, session.data);
  }

  set(
    sid: string,
    session: Record<string, unknown>,
    callback: (err?: Error | null) => void
  ) {
    sessionStore[sid] = {
      data: session,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };
    callback();
  }

  destroy(sid: string, callback: (err?: Error | null) => void) {
    delete sessionStore[sid];
    callback();
  }

  touch(
    sid: string,
    session: Record<string, unknown>,
    callback: (err?: Error | null) => void
  ) {
    const currentSession = sessionStore[sid];
    if (currentSession) {
      currentSession.expiresAt = Date.now() + 24 * 60 * 60 * 1000;
      currentSession.data = session;
    }
    callback();
  }

  all(callback: (err: Error | null, sessions?: Record<string, unknown>) => void) {
    const sessions: Record<string, unknown> = {};
    for (const [sid, session] of Object.entries(sessionStore)) {
      if (session.expiresAt > Date.now()) {
        sessions[sid] = session.data;
      } else {
        delete sessionStore[sid];
      }
    }
    callback(null, sessions);
  }

  length(callback: (err: Error | null, length?: number) => void) {
    let count = 0;
    for (const session of Object.values(sessionStore)) {
      if (session.expiresAt > Date.now()) {
        count++;
      }
    }
    callback(null, count);
  }

  clear(callback: (err?: Error | null) => void) {
    for (const sid of Object.keys(sessionStore)) {
      delete sessionStore[sid];
    }
    callback();
  }
}

// Middleware setup
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Configure session middleware
app.use(
  session({
    store: new InMemorySessionStore() as any,
    secret: crypto.randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    genid: () => crypto.randomUUID(),
  })
);

// Type augmentation for session
declare global {
  namespace Express {
    interface Request {
      session: session.Session & {
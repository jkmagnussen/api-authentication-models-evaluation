```typescript
import express from "express";
import session from "express-session";
import { v4 as uuidv4 } from "uuid";

const app = express();

// Simple in-memory store for sessions (in production, use a proper session store like connect-mongo)
const sessionStore: Record<
  string,
  { userId?: string; username?: string; loginTime?: number; expiresAt: number }
> = {};

// Custom session store class
class SimpleSessionStore {
  get(
    sid: string,
    callback: (err: Error | null, session?: Express.Session | null) => void
  ): void {
    const session = sessionStore[sid];
    if (!session) {
      callback(null, null);
      return;
    }

    if (session.expiresAt < Date.now()) {
      delete sessionStore[sid];
      callback(null, null);
      return;
    }

    callback(null, session as unknown as Express.Session);
  }

  set(
    sid: string,
    session: Express.Session,
    callback?: (err?: Error | null) => void
  ): void {
    const expiresAt = session.cookie.expires
      ? new Date(session.cookie.expires).getTime()
      : Date.now() + 24 * 60 * 60 * 1000; // 24 hours default

    sessionStore[sid] = {
      ...session,
      expiresAt,
    } as unknown as {
      userId?: string;
      username?: string;
      loginTime?: number;
      expiresAt: number;
    };

    if (callback) {
      callback(null);
    }
  }

  destroy(sid: string, callback?: (err?: Error | null) => void): void {
    delete sessionStore[sid];
    if (callback) {
      callback(null);
    }
  }

  touch(
    sid: string,
    session: Express.Session,
    callback?: (err?: Error | null) => void
  ): void {
    const expiresAt = session.cookie.expires
      ? new Date(session.cookie.expires).getTime()
      : Date.now() + 24 * 60 * 60 * 1000;

    if (sessionStore[sid]) {
      sessionStore[sid].expiresAt = expiresAt;
    }

    if (callback) {
      callback(null);
    }
  }
}

// Configure session middleware
const sessionMiddleware = session({
  store: new SimpleSessionStore(),
  secret: process.env.SESSION_SECRET || "your-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: "strict",
  },
});

app.use(express.json());
app.use(sessionMiddleware);

// Type definitions for session data
declare global {
  namespace Express {
    interface Session {
      userId?: string;
      username?: string;
      loginTime?: number;
    }
  }
}

// Login handler
export const handleLogin = (
  req: express.Request,
  res: express.Response
): void => {
  const { username, password } = req.body;

  // Simple authentication (in production, validate against a database)
  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

  if (password !== "demo") {
```typescript
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import { randomBytes } from "crypto";

const app = express();

// Custom session store implementation
class InMemoryStore extends session.Store {
  private sessions: Map<string, any> = new Map();

  get(
    sid: string,
    callback: (err: Error | null, session?: any) => void
  ): void {
    const sessionData = this.sessions.get(sid);
    if (sessionData && sessionData.expiresAt > Date.now()) {
      callback(null, sessionData.data);
    } else {
      this.sessions.delete(sid);
      callback(null, undefined);
    }
  }

  set(
    sid: string,
    session: any,
    callback?: (err?: Error | null) => void
  ): void {
    const expiresAt = Date.now() + 1000 * 60 * 60 * 24; // 24 hours
    this.sessions.set(sid, { data: session, expiresAt });
    if (callback) callback(null);
  }

  destroy(sid: string, callback?: (err?: Error | null) => void): void {
    this.sessions.delete(sid);
    if (callback) callback(null);
  }

  clear(callback?: (err?: Error | null) => void): void {
    this.sessions.clear();
    if (callback) callback(null);
  }

  length(callback: (err: Error | null, length?: number) => void): void {
    callback(null, this.sessions.size);
  }
}

// Initialize session middleware
const sessionStore = new InMemoryStore();

app.use(express.json());
app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-prod",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      sameSite: "lax",
    },
    genid: () => randomBytes(16).toString("hex"),
  })
);

// Session type augmentation
declare global {
  namespace Express {
    interface Session {
      userId?: string;
      username?: string;
      loginCount?: number;
      lastActivity?: Date;
      preferences?: {
        theme?: string;
        notifications?: boolean;
      };
    }
  }
}

// Middleware to track session activity
export const trackActivityMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.session) {
    req.session.lastActivity = new Date();
  }
  next();
};

// Session initialization endpoint
export const initializeSession = (req: Request, res: Response) => {
  if (!req.session) {
    return res.status(500).json({ error: "Session not available" });
  }

  req.session.userId = `user_${randomBytes(8).toString("hex")}`;
  req.session.username = `guest_${Math.random().toString(36).substring(7)}`;
  req.session.loginCount = (req.session.loginCount || 0) + 1;
  req.session.lastActivity = new Date();
  req.session.preferences = {
    theme: "light",
    notifications: true,
  };

  req.session.save((err) => {
    if
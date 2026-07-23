```typescript
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import { v4 as uuidv4 } from "uuid";

// Session store implementation
class InMemorySessionStore {
  private sessions: Map<string, SessionData> = new Map();

  get(
    sessionId: string,
    callback: (err: Error | null, session?: SessionData) => void
  ): void {
    const session = this.sessions.get(sessionId);
    callback(null, session);
  }

  set(
    sessionId: string,
    sessionData: SessionData,
    callback: (err?: Error | null) => void
  ): void {
    this.sessions.set(sessionId, sessionData);
    callback();
  }

  destroy(sessionId: string, callback: (err?: Error | null) => void): void {
    this.sessions.delete(sessionId);
    callback();
  }

  clear(callback: (err?: Error | null) => void): void {
    this.sessions.clear();
    callback();
  }

  length(callback: (err: Error | null, length?: number) => void): void {
    callback(null, this.sessions.size);
  }
}

interface SessionData {
  userId?: string;
  userName?: string;
  loginTime?: number;
  lastActivity?: number;
  preferences?: {
    theme: string;
    language: string;
  };
}

// Extend express session interface
declare global {
  namespace Express {
    interface Session {
      userId?: string;
      userName?: string;
      loginTime?: number;
      lastActivity?: number;
      preferences?: {
        theme: string;
        language: string;
      };
    }
  }
}

export function initializeSessionMiddleware(): express.RequestHandler {
  const store = new InMemorySessionStore();

  return session({
    genid: () => uuidv4(),
    secret: process.env.SESSION_SECRET || "your-secret-key",
    store: store as any,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "strict",
    },
  });
}

export function requireAuthenticationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.session && req.session.userId) {
    req.session.lastActivity = Date.now();
    next();
  } else {
    res.status(401).json({ error: "Unauthorized: Session not found" });
  }
}

export function createSessionHandler(req: Request, res: Response): void {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  // Simulate authentication
  const userId = uuidv4();
  const userName = email.split("@")[0];

  req.session.userId = userId;
  req.session.userName = userName;
  req.session.loginTime = Date.now();
  req.session.lastActivity = Date.now();
  req.session.preferences = {
    theme: "light",
    language: "en",
  };

  req.session.save((err) => {
    if (err) {
      res.status(500).json({ error: "Failed to create session" });
      return;
    }
    res.status(200
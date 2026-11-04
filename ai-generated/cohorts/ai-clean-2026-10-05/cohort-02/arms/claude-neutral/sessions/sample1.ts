```typescript
import express, { Express, Request, Response } from 'express';
import session, { SessionOptions } from 'express-session';
import crypto from 'crypto';

const app: Express = express();

// In-memory session store (for demo purposes)
const sessionStore = new Map<string, SessionData>();

interface SessionData {
  userId?: string;
  username?: string;
  loginTime?: number;
  lastActivity?: number;
  isAuthenticated?: boolean;
}

// Configure session options
const sessionConfig: SessionOptions = {
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict',
  },
  genid: (req: Request) => crypto.randomUUID(),
  store: {
    get: (sid: string, callback) => {
      const data = sessionStore.get(sid);
      callback(null, data || null);
    },
    set: (sid: string, session: any, callback) => {
      sessionStore.set(sid, session);
      callback(null);
    },
    destroy: (sid: string, callback) => {
      sessionStore.delete(sid);
      callback(null);
    },
    all: (callback) => {
      const sessions = Array.from(sessionStore.entries()).map(([sid, data]) => ({
        sid,
        ...data,
      }));
      callback(null, sessions);
    },
    length: (callback) => {
      callback(null, sessionStore.size);
    },
    clear: (callback) => {
      sessionStore.clear();
      callback(null);
    },
    touch: (sid: string, session: any, callback) => {
      const data = sessionStore.get(sid);
      if (data) {
        data.lastActivity = Date.now();
        sessionStore.set(sid, data);
      }
      callback(null);
    },
  } as any,
};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session(sessionConfig));

// Middleware to update last activity
app.use((req: Request, res: Response, next) => {
  if (req.session) {
    req.session.lastActivity = Date.now();
  }
  next();
});

// Authentication middleware
export const requireAuth = (req: Request, res: Response, next) => {
  if (!req.session?.isAuthenticated) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// Login endpoint
export const handleLogin = (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  // Simple validation (in production, verify against database)
  if (password.length < 6) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Create session
  req.session.userId = crypto.randomUUID();
  req.session.username = username;
  req.session.isAuthenticated = true;
  req.session.loginTime = Date.now();
  req.session.lastActivity = Date.now();

  res.json({
    message: 'Login
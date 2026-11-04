```typescript
import express, { Request, Response } from 'express';
import session from 'express-session';
import crypto from 'crypto';

const app = express();

// In-memory store for session data (in production, use a persistent store)
const sessionStore = new Map<string, any>();

// Custom session store implementation
class CustomSessionStore {
  get(sid: string, callback: (err: any, session?: any) => void) {
    const session = sessionStore.get(sid);
    callback(null, session || null);
  }

  set(sid: string, session: any, callback?: (err?: any) => void) {
    sessionStore.set(sid, session);
    if (callback) callback();
  }

  destroy(sid: string, callback?: (err?: any) => void) {
    sessionStore.delete(sid);
    if (callback) callback();
  }

  all(callback: (err: any, obj?: any) => void) {
    const sessions: any = {};
    sessionStore.forEach((value, key) => {
      sessions[key] = value;
    });
    callback(null, sessions);
  }

  length(callback: (err: any, length?: number) => void) {
    callback(null, sessionStore.size);
  }

  clear(callback?: (err?: any) => void) {
    sessionStore.clear();
    if (callback) callback();
  }
}

// Configure session middleware
app.use(
  session({
    store: new CustomSessionStore() as any,
    secret: crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware to ensure session is initialized
const ensureSession = (req: Request, res: Response, next: Function) => {
  if (!req.session) {
    return res.status(500).json({ error: 'Session initialization failed' });
  }
  next();
};

app.use(ensureSession);

// Initialize user data in session
export const initializeSession = (req: Request, userData: any) => {
  if (req.session) {
    req.session.user = userData;
    req.session.loginTime = new Date();
    req.session.lastActivity = new Date();
  }
};

// Update last activity timestamp
export const updateActivity = (req: Request) => {
  if (req.session) {
    req.session.lastActivity = new Date();
  }
};

// Check if user is authenticated
export const isAuthenticated = (req: Request): boolean => {
  return req.session && !!req.session.user;
};

// Get current user from session
export const getCurrentUser = (req: Request) => {
  return req.session?.user || null;
};

// Set session data
export const setSessionData = (req: Request, key: string, value: any) => {
  if (req.session) {
    req.session[key] = value;
  }
};

// Get session data
export const getSessionData = (req: Request, key: string) => {
  return req.session?.[key] || null;
};

// Clear session
export const clearSession = (req: Request, callback?: (err?: any) => void) => {
  req.session?.destroy(callback);
};

// Login endpoint
app.post('/login', (req: Request, res: Response) => {
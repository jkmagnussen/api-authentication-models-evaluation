```typescript
import express, { Request, Response } from "express";
import session from "express-session";
import crypto from "crypto";

const app = express();

// In-memory store for sessions (in production, use a proper session store)
const sessionStore = new Map<
  string,
  {
    userId?: string;
    username?: string;
    email?: string;
    loginTime?: Date;
    lastActivity?: Date;
  }
>();

// Middleware setup
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);

// Session configuration
app.use(
  session({
    secret: crypto.randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    store: new (class CustomSessionStore {
      get(
        sid: string,
        callback: (err: Error | null, session?: any) => void
      ) {
        const session = sessionStore.get(sid);
        callback(null, session);
      }

      set(
        sid: string,
        session: any,
        callback?: (err?: Error) => void
      ) {
        sessionStore.set(sid, session);
        if (callback) callback();
      }

      destroy(sid: string, callback?: (err?: Error) => void) {
        sessionStore.delete(sid);
        if (callback) callback();
      }
    })(),
  })
);

// Type augmentation for session
declare global {
  namespace Express {
    interface Session {
      userId?: string;
      username?: string;
      email?: string;
      loginTime?: Date;
      lastActivity?: Date;
    }
  }
}

// Middleware to update last activity
export const updateLastActivity = (
  req: Request,
  res: Response,
  next: Function
) => {
  if (req.session) {
    req.session.lastActivity = new Date();
  }
  next();
};

// Middleware to check if user is authenticated
export const requireAuth = (req: Request, res: Response, next: Function) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      error: "Not authenticated",
    });
  }
  next();
};

// Login endpoint
export const login = (req: Request, res: Response) => {
  const { username, password } = req.body;

  // Simple validation (in production, verify against database)
  if (!username || !password) {
    return res.status(400).json({
      error: "Username and password required",
    });
  }

  // Simulate user authentication
  const userId = crypto.randomBytes(8).toString("hex");

  // Set session data
  req.session.userId = userId;
  req.session.username = username;
  req.session.email = `${username}@example.com`;
  req.session.loginTime = new Date();
  req.session.lastActivity = new Date();

  res.json({
    message: "Login successful",
    user: {
      userId,
      username,
      email: req.session.email,
    },
  });
};

// Logout endpoint
export const logout = (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        error: "Failed to logout",
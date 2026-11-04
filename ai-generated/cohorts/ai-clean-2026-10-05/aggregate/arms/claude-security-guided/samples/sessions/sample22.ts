```typescript
import express, { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { randomBytes } from "crypto";

const app: Express = express();

// Secure session configuration with secure defaults
const sessionConfig = {
  secret: process.env.SESSION_SECRET || randomBytes(32).toString("hex"),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    httpOnly: true, // Prevent XSS attacks
    sameSite: "strict" as const, // CSRF protection
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
  },
  name: "sessionId", // Non-default session cookie name
};

// Apply session middleware
app.use(session(sessionConfig));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Input validation utilities
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === "string" && emailRegex.test(email) && email.length < 256;
};

const validateUsername = (username: string): boolean => {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return (
    typeof username === "string" &&
    usernameRegex.test(username) &&
    username.length >= 3 &&
    username.length <= 20
  );
};

const validatePassword = (password: string): boolean => {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    password.length <= 128
  );
};

// Session type extension for TypeScript
declare module "express-session" {
  interface SessionData {
    userId?: string;
    username?: string;
    email?: string;
    isAuthenticated?: boolean;
    loginAttempts?: number;
    lastLoginAttempt?: number;
  }
}

// Middleware to enforce authenticated sessions
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.session.isAuthenticated || !req.session.userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
};

// Middleware to prevent brute force attacks
export const rateLimitLogin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const now = Date.now();
  const lastAttempt = req.session.lastLoginAttempt || 0;
  const attempts = req.session.loginAttempts || 0;

  // Reset attempts after 15 minutes
  if (now - lastAttempt > 15 * 60 * 1000) {
    req.session.loginAttempts = 0;
    req.session.lastLoginAttempt = now;
  }

  // Block after 5 attempts
  if (attempts >= 5 && now - lastAttempt < 15 * 60 * 1000) {
    res.status(429).json({ error: "Too many login attempts. Try again later." });
    return;
  }

  next();
};

// Login endpoint with secure validation
export const login = (req: Request, res: Response): void => {
  const { username, password } = req.body;

  // Fail closed - validate all inputs
  if (!validate
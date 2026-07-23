```typescript
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import RedisStore from "connect-redis";
import { createClient } from "redis";

const app = express();

// Initialize Redis client for session storage
const redisClient = createClient({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
});

redisClient.connect().catch(console.error);

// Create Redis store for sessions
const store = new RedisStore({ client: redisClient });

// Session configuration with secure defaults
const sessionConfig = session({
  store,
  secret: process.env.SESSION_SECRET || "your-super-secret-key-change-this",
  resave: false,
  saveUninitialized: false,
  name: "auth_session",
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "strict" as const,
    maxAge: 30 * 60 * 1000, // 30 minutes
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: "/",
  },
  rolling: true,
});

export function setupSessionMiddleware(
  expressApp: express.Application
): void {
  expressApp.use(express.json());
  expressApp.use(sessionConfig);
}

// Extend Express Session type
declare module "express-session" {
  interface SessionData {
    userId: string;
    username: string;
    isAuthenticated: boolean;
    loginTimestamp: number;
    ipAddress?: string;
    userAgent?: string;
  }
}

// Validation for session data
function validateSessionData(data: Partial<express.Session>): boolean {
  if (!data.userId || typeof data.userId !== "string") {
    return false;
  }
  if (!data.username || typeof data.username !== "string") {
    return false;
  }
  if (typeof data.isAuthenticated !== "boolean") {
    return false;
  }
  if (
    !data.loginTimestamp ||
    typeof data.loginTimestamp !== "number" ||
    data.loginTimestamp <= 0
  ) {
    return false;
  }
  return true;
}

// Check session timeout
function isSessionExpired(loginTime: number): boolean {
  const sessionTimeout = 30 * 60 * 1000; // 30 minutes
  return Date.now() - loginTime > sessionTimeout;
}

export function requireAuthentication(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (
    !req.session.isAuthenticated ||
    !validateSessionData(req.session) ||
    isSessionExpired(req.session.loginTimestamp)
  ) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Additional security check for session fixation
  if (
    req.session.ipAddress &&
    req.session.ipAddress !== req.ip &&
    process.env.NODE_ENV === "production"
  ) {
    req.session.destroy((err) => {
      if (err) console.error("Session destruction error:", err);
    });
    res.status(401).json({ error: "Session validation failed" });
    return;
  }

  next();
}

export async function handleUserLogin(
  req: Request,
  res: Response
): Promise<void> {
  const { username, password } = req.body;

  // Input validation
  if (!username || typeof username !== "string"
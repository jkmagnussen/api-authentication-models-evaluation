```typescript
import express, { Request, Response, NextFunction } from "express";
import session, { Session, SessionData } from "express-session";
import RedisStore from "connect-redis";
import redis from "redis";
import crypto from "crypto";

const app = express();

interface AuthenticatedSession extends SessionData {
  userId?: string;
  createdAt?: number;
  ipAddress?: string;
  userAgent?: string;
}

declare global {
  namespace Express {
    interface Request {
      session: Session & Partial<AuthenticatedSession>;
    }
  }
}

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
});

const store = new RedisStore({ client: redisClient });

export const setupSecureSessionMiddleware = (): ReturnType<
  typeof session
> => {
  return session({
    store,
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
    name: "__Host-session",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: "strict",
      maxAge: 1800000,
      domain: process.env.COOKIE_DOMAIN,
      path: "/",
    },
    rolling: true,
    genid: (req: Request) => crypto.randomBytes(16).toString("hex"),
  });
};

export const validateSessionSecurity = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.session.userId) {
    next();
    return;
  }

  const clientIp = req.ip || req.connection.remoteAddress || "";
  const clientUserAgent = req.get("user-agent") || "";

  if (
    req.session.ipAddress &&
    req.session.ipAddress !== clientIp &&
    process.env.STRICT_IP_VALIDATION === "true"
  ) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
      }
    });
    res.status(401).json({ error: "Session IP mismatch detected" });
    return;
  }

  if (
    req.session.userAgent &&
    req.session.userAgent !== clientUserAgent &&
    process.env.STRICT_UA_VALIDATION === "true"
  ) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
      }
    });
    res.status(401).json({ error: "Session user agent mismatch detected" });
    return;
  }

  next();
};

export const regenerateSessionAfterLogin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  req.session.regenerate((err) => {
    if (err) {
      res.status(500).json({ error: "Failed to regenerate session" });
      return;
    }

    const clientIp = req.ip || req.connection.remoteAddress || "";
    const clientUserAgent = req.get("user-agent") || "";

    req.session.userId = req.body.userId;
    req.session.createdAt = Date.now();
    req.session.ipAddress = clientIp;
    req.session.userAgent = clientUserAgent;

    req.session.save((err) => {
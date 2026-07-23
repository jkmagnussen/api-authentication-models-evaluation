```typescript
import express, { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import crypto from "crypto";

interface CustomSessionData extends session.Session {
  userId?: string;
  userName?: string;
  loginTimestamp?: number;
  authLevel?: "user" | "admin" | "guest";
}

declare global {
  namespace Express {
    interface Request {
      session: CustomSessionData;
    }
  }
}

export const createSessionMiddleware = () => {
  return session({
    secret: crypto.randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
      sameSite: "strict",
    },
  });
};

export const initializeSessionApp = (): Express => {
  const app = express();
  app.use(express.json());
  app.use(createSessionMiddleware());
  return app;
};

export const loginHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: "Missing credentials" });
      return;
    }

    // Simulated user validation
    if (password.length < 6) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const userId = crypto.randomUUID();
    req.session.userId = userId;
    req.session.userName = username;
    req.session.loginTimestamp = Date.now();
    req.session.authLevel = username === "admin" ? "admin" : "user";

    req.session.save((err) => {
      if (err) {
        next(err);
        return;
      }
      res.status(200).json({
        message: "Login successful",
        sessionId: req.sessionID,
        user: { userId, userName: username, authLevel: req.session.authLevel },
      });
    });
  } catch (error) {
    next(error);
  }
};

export const logoutHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  req.session.destroy((err) => {
    if (err) {
      next(err);
      return;
    }
    res.clearCookie("connect.sid");
    res
      .status(200)
      .json({ message: "Logout successful", sessionDestroyed: true });
  });
};

export const sessionCheckMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated", redirectUrl: "/login" });
    return;
  }
  next();
};

export const adminOnlyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.session.authLevel !== "admin") {
    res.status(403).json({
      error: "Insufficient permissions",
      requiredLevel: "admin",
      currentLevel: req.session.authLevel || "none",
    });
    return;
  }
  next();
};

export const getSessionInfoHandler = (req: Request, res: Response) => {
  const sessionInfo = {
    sessionId: req.session
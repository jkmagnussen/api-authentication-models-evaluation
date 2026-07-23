```typescript
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import crypto from "crypto";

export const createSessionManager = () => {
  const sessionStore = new Map<
    string,
    { userId: string; username: string; expiresAt: number }
  >();

  const sessionMiddleware = session({
    secret: crypto.randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: true, maxAge: 3600000 },
  });

  return { sessionMiddleware, sessionStore };
};

export const attachUserToSession = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.session && !req.session.userId) {
    req.session.userId = `user_${crypto.randomBytes(8).toString("hex")}`;
    req.session.loginTime = Date.now();
  }
  next();
};

export const validateSessionToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
};

export const refreshSessionTimeout = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.session) {
    req.session.touch?.();
  }
  next();
};

export const setupSessionRoutes = (app: express.Application) => {
  app.get("/api/session/current", (req: Request, res: Response) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: "No active session" });
    }

    res.json({
      sessionId: req.sessionID,
      userId: req.session.userId,
      loginTime: req.session.loginTime,
    });
  });

  app.post("/api/session/login", (req: Request, res: Response) => {
    if (!req.session) {
      return res.status(500).json({ error: "Session unavailable" });
    }

    const userId = `user_${Date.now()}`;
    const username = `user_${Math.random().toString(36).substring(7)}`;

    req.session.userId = userId;
    req.session.username = username;
    req.session.loginTime = Date.now();

    res.json({
      message: "Login successful",
      sessionId: req.sessionID,
      userId,
      username,
    });
  });

  app.post("/api/session/logout", (req: Request, res: Response) => {
    req.session?.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/session/extend", (req: Request, res: Response) => {
    if (!req.session) {
      return res.status(401).json({ error: "No session to extend" });
    }

    req.session.touch?.();
    res.json({ message: "Session extended", expiresIn: "1 hour" });
  });
};

export const startSessionServer = (port: number = 3000) => {
  const app = express();

  app.use(express.json());

  const { sessionMiddleware } = createSessionManager();
  app.use(sessionMidd
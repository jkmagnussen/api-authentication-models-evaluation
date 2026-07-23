```typescript
import express, { Request, Response, Router } from "express";
import session from "express-session";

declare global {
  namespace Express {
    interface Request {
      session: session.Session & Partial<session.SessionData> & {
        userId?: string;
        username?: string;
        loginTime?: number;
        isAdmin?: boolean;
      };
    }
  }
}

export const createSessionMiddleware = () => {
  return session({
    secret: process.env.SESSION_SECRET || "default-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "lax",
    },
  });
};

export const initializeAuthRoutes = (): Router => {
  const router = express.Router();

  router.post("/authenticate", (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Missing credentials" });
    }

    // Simplified authentication logic
    if (password === "demo-password") {
      req.session.userId = `user-${Date.now()}`;
      req.session.username = username;
      req.session.loginTime = Date.now();
      req.session.isAdmin = username === "admin";

      req.session.save((err) => {
        if (err) {
          return res.status(500).json({ error: "Session save failed" });
        }
        res.json({
          success: true,
          message: `User ${username} authenticated`,
          userId: req.session.userId,
        });
      });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  router.post("/logout", (req: Request, res: Response) => {
    const username = req.session.username || "unknown";
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ success: true, message: `User ${username} logged out` });
    });
  });

  router.get("/profile", requireAuth, (req: Request, res: Response) => {
    res.json({
      userId: req.session.userId,
      username: req.session.username,
      loginTime: new Date(req.session.loginTime || 0),
      isAdmin: req.session.isAdmin || false,
    });
  });

  router.get("/session-info", (req: Request, res: Response) => {
    const isAuthenticated = !!req.session.userId;
    res.json({
      authenticated: isAuthenticated,
      username: req.session.username || null,
      sessionId: req.sessionID,
      sessionCookie: req.session.cookie,
    });
  });

  return router;
};

export const requireAuth = (
  req: Request,
  res: Response,
  next: express.NextFunction
) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: express.NextFunction
) => {
  if (!req.session.isAdmin) {
    return res.
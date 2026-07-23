```typescript
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import { randomBytes } from "crypto";

declare global {
  namespace Express {
    interface Request {
      session: session.Session & {
        userId?: string;
        userName?: string;
        loginTime?: number;
        permissions?: string[];
      };
    }
  }
}

export const createSessionMiddleware = () => {
  return session({
    secret: process.env.SESSION_SECRET || "dev-secret-key-change-in-prod",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "strict",
    },
  });
};

export const requireAuthentication = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.session.userId) {
    return res
      .status(401)
      .json({ error: "Unauthorized - Please login first" });
  }
  next();
};

export const requirePermission =
  (requiredPermission: string) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res
        .status(401)
        .json({ error: "Unauthorized - Please login first" });
    }
    if (
      !req.session.permissions ||
      !req.session.permissions.includes(requiredPermission)
    ) {
      return res
        .status(403)
        .json({ error: "Forbidden - Insufficient permissions" });
    }
    next();
  };

export const initializeAuthRoutes = (router: express.Router) => {
  router.post("/auth/login", (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Simulated user verification
    const userId = randomBytes(8).toString("hex");
    const userName = email.split("@")[0];

    req.session.userId = userId;
    req.session.userName = userName;
    req.session.loginTime = Date.now();
    req.session.permissions = ["read", "write"];

    req.session.save((err) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Failed to establish session" });
      }
      res.status(200).json({
        message: "Login successful",
        user: { id: userId, name: userName },
      });
    });
  });

  router.post("/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      res.status(200).json({ message: "Logout successful" });
    });
  });

  router.get("/auth/profile", requireAuthentication, (req: Request, res: Response) => {
    res.status(200).json({
      userId: req.session.userId,
      userName: req.session.userName,
      loginTime: req.session.loginTime,
      permissions: req.session.permissions,
    });
  });

  router.post(
    "/auth/permissions/grant",
    requirePermission("
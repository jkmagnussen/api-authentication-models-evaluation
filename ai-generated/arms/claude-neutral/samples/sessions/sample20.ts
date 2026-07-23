```typescript
import express, { Request, Response, NextFunction } from "express";
import session from "express-session";
import crypto from "crypto";

declare global {
  namespace Express {
    interface Request {
      session: session.Session & {
        userId?: string;
        userName?: string;
        loginTime?: Date;
        permissions?: string[];
        accessToken?: string;
      };
    }
  }
}

const sessionConfig: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  },
  genid: (req: Request) => crypto.randomUUID(),
};

export const initializeSessionMiddleware = (app: express.Application) => {
  app.use(session(sessionConfig));
};

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (
    req.session &&
    req.session.userId &&
    req.session.accessToken &&
    !isSessionExpired(req.session)
  ) {
    return next();
  }

  res.status(401).json({ error: "Unauthorized access" });
};

export const createUserSession = (
  req: Request,
  userId: string,
  userName: string,
  permissions: string[] = []
) => {
  req.session.userId = userId;
  req.session.userName = userName;
  req.session.loginTime = new Date();
  req.session.permissions = permissions;
  req.session.accessToken = generateAccessToken(userId);
};

export const terminateUserSession = (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Failed to terminate session" });
      return;
    }
    res.clearCookie("connect.sid");
    res.status(200).json({ message: "Session terminated successfully" });
  });
};

export const checkUserPermission = (
  requiredPermission: string
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (
      !req.session.permissions ||
      !req.session.permissions.includes(requiredPermission)
    ) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
};

export const refreshSessionTimeout = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.session && req.session.userId) {
    req.session.touch();
  }
  next();
};

export const getSessionInfo = (req: Request): object => {
  return {
    sessionId: req.sessionID,
    userId: req.session.userId,
    userName: req.session.userName,
    loginTime: req.session.loginTime,
    permissions: req.session.permissions,
    isActive: req.session.userId ? true : false,
  };
};

export const validateSessionIntegrity = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (
    req.session &&
    req.session.userId &&
    req.session.accessToken &&
    req.session.loginTime
  ) {
    const tokenValidity = verify
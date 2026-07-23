import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const SECRET_KEY = "your-secret-key-change-this";

interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      authenticatedUser?: JWTPayload;
    }
  }
}

export const validateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid token format" });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as JWTPayload;
    req.authenticatedUser = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Token has expired" });
    } else if (err instanceof jwt.JsonWebTokenError) {
      res.status(403).json({ error: "Invalid token signature" });
    } else {
      res.status(403).json({ error: "Token validation failed" });
    }
  }
};

export const issueAuthToken = (
  userId: string,
  email: string,
  expiresIn: string = "24h"
): string => {
  return jwt.sign({ userId, email }, SECRET_KEY, { expiresIn });
};

export const createAuthRouter = (): Router => {
  const router = Router();

  router.post("/login", (req: Request, res: Response): void => {
    const { userId, email } = req.body;

    if (!userId || !email) {
      res.status(400).json({ error: "userId and email are required" });
      return;
    }

    const token = issueAuthToken(userId, email);
    res.json({ token, expiresIn: "24h" });
  });

  router.post("/refresh", validateJWT, (req: Request, res: Response): void => {
    if (!req.authenticatedUser) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const newToken = issueAuthToken(
      req.authenticatedUser.userId,
      req.authenticatedUser.email
    );
    res.json({ token: newToken, expiresIn: "24h" });
  });

  router.get(
    "/protected",
    validateJWT,
    (req: Request, res: Response): void => {
      res.json({
        message: "Access granted to protected resource",
        user: req.authenticatedUser,
      });
    }
  );

  router.get("/verify", validateJWT, (req: Request, res: Response): void => {
    res.json({ valid: true, user: req.authenticatedUser });
  });

  return router;
};

export const decodeTokenWithoutVerification = (token: string): JWTPayload => {
  return jwt.decode(token) as JWTPayload;
};
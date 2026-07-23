```typescript
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      authenticatedUser?: TokenPayload;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-prod";
const TOKEN_EXPIRY = "24h";

export const issueAccessToken = (payload: Omit<TokenPayload, "iat" | "exp">) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

export const validateTokenMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header missing" });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return res.status(401).json({ error: "Invalid authorization header format" });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    req.authenticatedUser = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: "Token has expired" });
    }
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: "Invalid token" });
    }
    return res.status(500).json({ error: "Token validation failed" });
  }
};

export const requireAuthenticationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.authenticatedUser) {
    return res.status(403).json({ error: "Authentication required" });
  }
  next();
};

export const setupAuthRoutes = (app: express.Application) => {
  app.post("/auth/login", (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required" });
    }

    if (password !== "demo-password") {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = issueAccessToken({
      userId: "user-" + Math.random().toString(36).substr(2, 9),
      email: email,
    });

    res.json({ accessToken: token, tokenType: "Bearer" });
  });

  app.post("/auth/refresh", validateTokenMiddleware, (req: Request, res: Response) => {
    if (!req.authenticatedUser) {
      return res.status(401).json({ error: "No user context" });
    }

    const newToken = issueAccessToken({
      userId: req.authenticatedUser.userId,
      email: req.authenticatedUser.email,
    });

    res.json({ accessToken: newToken, tokenType: "Bearer" });
  });

  app.get(
    "/protected/profile",
    validateTokenMiddleware,
    requireAuthenticationMiddleware,
    (req: Request, res: Response) => {
      res.json({
        message: "Profile data
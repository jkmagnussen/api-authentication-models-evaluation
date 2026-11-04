```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const client = new Anthropic();

const JWT_SECRET = "your-secret-key-change-in-production";
const JWT_EXPIRY = "1h";

interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.user = payload;
  next();
};

export const loginHandler = (req: Request, res: Response): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  // Simulate user validation (in production, check against database)
  if (password.length < 6) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const payload: JWTPayload = {
    userId: `user_${Date.now()}`,
    email: email,
  };

  const token = generateToken(payload);
  res.json({ token, user: payload });
};

export const protectedHandler = (req: Request, res: Response): void => {
  res.json({
    message: "This is a protected route",
    user: req.user,
  });
};

export const logoutHandler = (req: Request, res: Response): void => {
  // In a real application, you might want to blacklist the token
  res.json({ message: "Logged out successfully" });
};

export const getTokenInfoHandler = (req: Request, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: "No user authenticated" });
    return;
  }

  res.json({
    message: "Token information",
    user: req.user,
    issuedAt: new Date((req.user.iat || 0) * 1000).toISOString(),
    expiresAt: new Date((req.user.exp || 0) * 1000).toISOString(),
  });
};

export const analyzeTokenWithAI = async (
  token: string
): Promise<string | null> => {
  const payload = verifyToken(token);

  if (!payload) {
    return null;
  }

  const message = await
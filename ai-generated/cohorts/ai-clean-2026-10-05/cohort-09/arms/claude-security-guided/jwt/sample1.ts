```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const client = new Anthropic();
const app = express();

interface AuthRequest extends Request {
  userId?: string;
  token?: string;
}

interface JWTPayload {
  userId: string;
  iat: number;
  exp: number;
}

// Environment variables for secure defaults
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key-change-in-production";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "1h";
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds

// Secure JWT authentication middleware
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers["authorization"];

  if (!authHeader || typeof authHeader !== "string") {
    res.status(401).json({ error: "Missing authorization header" });
    return;
  }

  const parts = authHeader.split(" ");

  // Validate Bearer scheme
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    res.status(401).json({ error: "Invalid authorization header format" });
    return;
  }

  const token = parts[1];

  // Validate token format (basic check)
  if (!token || typeof token !== "string" || token.length === 0) {
    res.status(401).json({ error: "Invalid token format" });
    return;
  }

  // Prevent token from being too long (potential attack vector)
  if (token.length > 2000) {
    res.status(401).json({ error: "Token exceeds maximum length" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Validate decoded payload structure
    if (!decoded.userId || typeof decoded.userId !== "string") {
      res.status(401).json({ error: "Invalid token payload" });
      return;
    }

    // Validate userId format (alphanumeric and common special chars only)
    if (!/^[a-zA-Z0-9_-]+$/.test(decoded.userId)) {
      res.status(401).json({ error: "Invalid user ID format" });
      return;
    }

    req.userId = decoded.userId;
    req.token = token;
    next();
  } catch (error) {
    // Fail closed - reject on any JWT verification error
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Token expired" });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: "Invalid token" });
    } else {
      res.status(401).json({ error: "Authentication failed" });
    }
  }
};

// Generate JWT token with secure defaults
export const generateToken = (userId: string): string => {
  // Validate userId input
  if (!userId || typeof userId !== "string") {
    throw new Error("Invalid userId");
  }

  if (userId.length === 0 || userId.length > 255) {
    throw new Error("userId must be between 1 and 255 characters");
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(userId)) {
    throw new Error("userId contains invalid characters");
  }

  return jwt.sign({ userId }, JWT
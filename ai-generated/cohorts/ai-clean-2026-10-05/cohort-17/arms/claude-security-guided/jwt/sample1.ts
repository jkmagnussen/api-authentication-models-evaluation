```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const client = new Anthropic();

interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-prod";
const TOKEN_EXPIRY = "1h";

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  // Fail closed: reject if no auth header
  if (!authHeader) {
    res.status(401).json({ error: "Missing authorization header" });
    return;
  }

  // Validate auth header format
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    res.status(401).json({ error: "Invalid authorization header format" });
    return;
  }

  const token = parts[1];

  // Validate token is a string and has reasonable length
  if (typeof token !== "string" || token.length > 1000 || token.length < 10) {
    res.status(401).json({ error: "Invalid token format" });
    return;
  }

  try {
    // Verify and decode the JWT
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Validate decoded payload structure
    if (!decoded.userId || !decoded.email) {
      res.status(401).json({ error: "Invalid token payload" });
      return;
    }

    // Validate userId and email are strings
    if (typeof decoded.userId !== "string" || typeof decoded.email !== "string") {
      res.status(401).json({ error: "Invalid token claims" });
      return;
    }

    // Additional validation: check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(decoded.email)) {
      res.status(401).json({ error: "Invalid email format in token" });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    // Fail closed: reject on any verification error
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Token expired" });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: "Invalid token" });
    } else {
      res.status(401).json({ error: "Authentication failed" });
    }
  }
};

export const generateToken = (payload: JWTPayload): string => {
  // Secure defaults: always set expiry
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
    algorithm: "HS256",
  });
};

export const validateTokenPayload = (payload: unknown): payload is JWTPayload => {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  const obj = payload as Record<string, unknown>;

  // Validate required fields
  if (typeof obj.userId !== "string" || obj.userId.length === 0) {
    return false;
  }

  if (typeof obj.email
```typescript
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Secure defaults configuration
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "1h";
const TOKEN_ALGORITHM = "HS256";
const MAX_TOKEN_LENGTH = 1000; // Prevent DoS attacks with extremely long tokens

// Types for JWT payload
interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

interface AuthRequest extends Request {
  user?: TokenPayload;
  token?: string;
}

// Validation utilities
function validateTokenFormat(token: string): boolean {
  // Token should be a valid JWT format (three parts separated by dots)
  if (!token || typeof token !== "string") {
    return false;
  }

  if (token.length > MAX_TOKEN_LENGTH) {
    return false;
  }

  const parts = token.split(".");
  return parts.length === 3 && parts.every((part) => part.length > 0);
}

function validatePayload(payload: unknown): payload is TokenPayload {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const obj = payload as Record<string, unknown>;

  // Validate required fields
  if (typeof obj.userId !== "string" || obj.userId.length === 0) {
    return false;
  }

  if (typeof obj.email !== "string" || !obj.email.includes("@")) {
    return false;
  }

  // Validate email format (basic check)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(obj.email)) {
    return false;
  }

  return true;
}

// JWT Middleware - Fail closed approach
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || typeof authHeader !== "string") {
      res.status(401).json({ error: "No authorization header provided" });
      return;
    }

    // Validate header format (Bearer <token>)
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      res.status(401).json({ error: "Invalid authorization header format" });
      return;
    }

    const token = parts[1];

    // Validate token format before attempting to verify
    if (!validateTokenFormat(token)) {
      res.status(401).json({ error: "Invalid token format" });
      return;
    }

    // Verify and decode token
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [TOKEN_ALGORITHM],
    });

    // Validate payload structure and content
    if (!validatePayload(decoded)) {
      res.status(401).json({ error: "Invalid token payload" });
      return;
    }

    // Attach validated user info to request
    req.user = decoded as TokenPayload;
    req.token = token;

    next();
  } catch (error) {
    // Fail closed - any error results in 401
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Token has expired" });
    } else if (error instanceof jwt.JsonWebTokenError
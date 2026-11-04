```typescript
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const app = express();
app.use(express.json());

// Environment variables with secure defaults
const JWT_SECRET = process.env.JWT_SECRET || "default-insecure-secret-change-me";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "1h";
const JWT_ALGORITHM = "HS256";

// Types for JWT payload
interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Extend Express Request to include decoded token
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      token?: string;
    }
  }
}

// Validation function for JWT token
function validateTokenFormat(token: string): boolean {
  if (!token || typeof token !== "string") {
    return false;
  }

  // JWT should have 3 parts separated by dots
  const parts = token.split(".");
  if (parts.length !== 3) {
    return false;
  }

  // Validate each part is base64url encoded
  const base64UrlRegex = /^[A-Za-z0-9_-]*$/;
  for (const part of parts) {
    if (!part || !base64UrlRegex.test(part)) {
      return false;
    }
  }

  return true;
}

// Validation function for user credentials
function validateUserCredentials(email: string, password: string): boolean {
  // Email validation
  if (!email || typeof email !== "string") {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }

  // Password validation - minimum 8 characters
  if (!password || typeof password !== "string" || password.length < 8) {
    return false;
  }

  return true;
}

// Validation function for JWT payload
function validateJwtPayload(payload: unknown): payload is JwtPayload {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const p = payload as Record<string, unknown>;
  return (
    typeof p.userId === "string" &&
    p.userId.length > 0 &&
    typeof p.email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)
  );
}

// Middleware for JWT authentication
export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || typeof authHeader !== "string") {
      res.status(401).json({
        error: "Unauthorized",
        message: "Missing authorization header",
      });
      return;
    }

    // Bearer token format validation
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid authorization header format",
      });
      return;
    }

    const token = parts[1];

    // Validate token format before verification
    if (!validateTokenFormat(token)) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid token format",
      });
      return;
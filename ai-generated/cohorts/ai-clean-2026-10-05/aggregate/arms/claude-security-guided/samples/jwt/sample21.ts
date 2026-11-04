```typescript
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Secure defaults
const DEFAULT_TOKEN_EXPIRY = "1h";
const DEFAULT_ALGORITHM = "HS256";
const TOKEN_BLACKLIST = new Set<string>();

// Type definitions for secure JWT payload
interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

interface AuthRequest extends Request {
  user?: JWTPayload;
  token?: string;
}

// Validate environment variables exist
function validateEnv(): { secret: string } {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  if (secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters long");
  }

  return { secret };
}

// Sanitize and validate JWT payload
function validatePayload(payload: unknown): JWTPayload {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid payload format");
  }

  const obj = payload as Record<string, unknown>;

  // Validate userId
  if (typeof obj.userId !== "string" || obj.userId.length === 0) {
    throw new Error("Invalid userId in payload");
  }

  if (obj.userId.length > 255) {
    throw new Error("userId exceeds maximum length");
  }

  // Validate email
  if (typeof obj.email !== "string" || !isValidEmail(obj.email)) {
    throw new Error("Invalid email in payload");
  }

  return {
    userId: obj.userId,
    email: obj.email,
  };
}

// Email validation using strict regex
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{1,255}$/;
  return emailRegex.test(email) && email.length <= 320;
}

// Extract token from Authorization header
function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  // Validate header format
  if (typeof authHeader !== "string") {
    return null;
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2) {
    return null;
  }

  const [scheme, token] = parts;

  // Case-insensitive comparison
  if (scheme.toLowerCase() !== "bearer") {
    return null;
  }

  // Validate token format (JWT should be three base64url strings separated by dots)
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
    return null;
  }

  return token;
}

// JWT authentication middleware - fail closed on any error
export const jwtAuthMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { secret } = validateEnv();

    // Extract token from Authorization header
    const token = extractToken(req.get("Authorization"));

    if (!token) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Missing or invalid authorization token",
      });
      return;
    }

    // Check if token is blacklisted
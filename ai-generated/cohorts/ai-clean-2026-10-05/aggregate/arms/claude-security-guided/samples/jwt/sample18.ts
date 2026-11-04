```typescript
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Secure configuration with safe defaults
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "1h";
const TOKEN_ALGORITHM = "HS256";
const MAX_TOKEN_LENGTH = 10000; // Prevent extremely large tokens

// Extend Express Request to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        iat: number;
      };
    }
  }
}

// Utility function to validate JWT secret
function validateJWTSecret(secret: string): void {
  if (!secret || secret.length < 32) {
    console.warn(
      "Warning: JWT secret is too short. Use at least 32 characters in production."
    );
  }
  if (secret === "your-secret-key-change-in-production") {
    throw new Error(
      "CRITICAL: Default JWT secret is still in use. Set JWT_SECRET environment variable."
    );
  }
}

// Validate token format before processing
function validateTokenFormat(token: string): boolean {
  // Check length
  if (!token || token.length > MAX_TOKEN_LENGTH) {
    return false;
  }

  // Check basic JWT structure (three parts separated by dots)
  const parts = token.split(".");
  if (parts.length !== 3) {
    return false;
  }

  // Check that all parts are non-empty
  if (parts.some((part) => !part)) {
    return false;
  }

  // Validate base64 format
  const base64Regex = /^[A-Za-z0-9_-]+$/;
  if (!parts.every((part) => base64Regex.test(part))) {
    return false;
  }

  return true;
}

// Extract token from Authorization header
function extractToken(authHeader?: string): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}

// Middleware to verify JWT token
export const verifyJWT = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Validate JWT secret on first use
    validateJWTSecret(JWT_SECRET);

    // Get authorization header
    const authHeader = req.headers.authorization;

    // Extract token
    const token = extractToken(authHeader);

    // Fail closed - no token means unauthorized
    if (!token) {
      res.status(401).json({
        error: "Unauthorized",
        message: "No token provided",
      });
      return;
    }

    // Validate token format before attempting to verify
    if (!validateTokenFormat(token)) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid token format",
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [TOKEN_ALGORITHM],
    });

    // Validate decoded payload structure
    if (
      typeof decoded !== "object" ||
      !decoded.id ||
      !decoded.email ||
      typeof decoded.id !== "string" ||
      typeof decoded.email !== "string"
    ) {
      res.status(401).
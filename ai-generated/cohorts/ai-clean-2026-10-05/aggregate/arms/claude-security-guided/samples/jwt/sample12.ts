```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const client = new Anthropic();

interface DecodedToken {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: DecodedToken;
    }
  }
}

// Secure defaults configuration
const JWT_SECRET = process.env.JWT_SECRET || "default-insecure-secret";
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || "1h";
const ALGORITHM = "HS256";

// Validate JWT secret is set (fail closed on insecure defaults)
if (JWT_SECRET === "default-insecure-secret") {
  console.warn(
    "WARNING: Using default JWT secret. Set JWT_SECRET environment variable in production."
  );
}

// Validate and sanitize Bearer token from Authorization header
function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader || typeof authHeader !== "string") {
    return null;
  }

  // Trim whitespace
  const trimmedHeader = authHeader.trim();

  // Validate Bearer scheme
  if (!trimmedHeader.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = trimmedHeader.slice(7).trim();

  // Validate token is not empty and contains only valid JWT characters
  if (!token || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
    return null;
  }

  return token;
}

// Validate decoded token structure
function isValidDecodedToken(payload: any): payload is DecodedToken {
  return (
    payload &&
    typeof payload === "object" &&
    typeof payload.userId === "string" &&
    typeof payload.email === "string" &&
    typeof payload.iat === "number" &&
    typeof payload.exp === "number" &&
    payload.userId.length > 0 &&
    payload.userId.length <= 255 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email) &&
    payload.email.length <= 255
  );
}

// JWT Authentication Middleware
export function jwtAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  // Extract and validate token
  const token = extractToken(authHeader);
  if (!token) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or missing authentication token",
    });
    return;
  }

  // Verify and decode token
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [ALGORITHM],
      clockTolerance: 0,
    });

    // Validate decoded token structure
    if (!isValidDecodedToken(decoded)) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid token payload",
      });
      return;
    }

    // Attach user to request
    req.user = decoded;
    next();
  } catch (error) {
    // Fail closed on any JWT verification error
    const errorMessage =
      error instanceof jwt.TokenExpiredError
        ? "Token has expired"
        : error instanceof jwt.JsonWebTokenError
          ? "
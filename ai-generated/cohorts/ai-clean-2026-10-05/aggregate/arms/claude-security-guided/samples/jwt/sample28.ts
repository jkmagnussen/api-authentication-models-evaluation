```typescript
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Secure defaults
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_ALGORITHM = "HS256";
const TOKEN_EXPIRY = "1h";
const MAX_TOKEN_LENGTH = 2048;

// Custom request type with user data
interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string; iat?: number; exp?: number };
}

// Validate JWT secret is properly configured
function validateJwtSecret(): void {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "your-secret-key-change-in-production") {
    console.warn("WARNING: Using default JWT secret. Set JWT_SECRET environment variable in production.");
  }
  if (JWT_SECRET.length < 32) {
    console.warn("WARNING: JWT secret is too short. Use at least 32 characters in production.");
  }
}

// Validate token format and length before processing
function validateTokenFormat(token: string): boolean {
  if (!token || typeof token !== "string") {
    return false;
  }
  if (token.length > MAX_TOKEN_LENGTH) {
    return false;
  }
  // JWT format: header.payload.signature
  const parts = token.split(".");
  if (parts.length !== 3) {
    return false;
  }
  // Each part should be valid base64url
  for (const part of parts) {
    if (!/^[A-Za-z0-9_-]*$/.test(part)) {
      return false;
    }
  }
  return true;
}

// Middleware to verify JWT token
export const verifyJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || typeof authHeader !== "string") {
      res.status(401).json({ error: "Missing authorization header" });
      return;
    }

    // Validate header format (Bearer <token>)
    const headerParts = authHeader.split(" ");
    if (headerParts.length !== 2 || headerParts[0] !== "Bearer") {
      res.status(401).json({ error: "Invalid authorization header format" });
      return;
    }

    const token = headerParts[1];

    // Validate token format before verification
    if (!validateTokenFormat(token)) {
      res.status(401).json({ error: "Invalid token format" });
      return;
    }

    // Verify and decode token
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
    });

    // Validate decoded token structure
    if (typeof decoded !== "object" || !decoded.id || !decoded.email) {
      res.status(401).json({ error: "Invalid token payload" });
      return;
    }

    // Attach user data to request
    req.user = {
      id: String(decoded.id),
      email: String(decoded.email),
      iat: decoded.iat,
      exp: decoded.exp,
    };

    next();
  } catch (error) {
    // Fail closed - return 401 for any verification error
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Token expired" });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: "Invalid token
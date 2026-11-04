```typescript
import express, { Request, Response, NextFunction, Application } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// Secure default configuration
const JWT_CONFIG = {
  algorithm: "HS256" as const,
  expiresIn: "1h",
  issuer: "secure-api",
  audience: "api-clients",
};

// Secret key for signing (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");

// Custom error for JWT authentication failures
class JWTAuthError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "JWTAuthError";
  }
}

// Type definitions for authenticated request
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    iat: number;
    exp: number;
  };
}

// Validate JWT token format and extract from request
export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;

  // Validate authorization header exists and has Bearer scheme
  if (!authHeader || typeof authHeader !== "string") {
    return null;
  }

  const parts = authHeader.split(" ");

  // Fail closed: require exact Bearer scheme format
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    throw new JWTAuthError(401, "Invalid authorization header format");
  }

  const token = parts[1];

  // Validate token is non-empty string
  if (!token || typeof token !== "string" || token.trim().length === 0) {
    throw new JWTAuthError(401, "Token is empty or invalid");
  }

  // Validate token format (JWT has 3 parts separated by dots)
  if (token.split(".").length !== 3) {
    throw new JWTAuthError(401, "Invalid token format");
  }

  return token;
}

// Verify and decode JWT token
export function verifyToken(token: string): {
  id: string;
  email: string;
  iat: number;
  exp: number;
} {
  try {
    // Verify token with strict options
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_CONFIG.algorithm],
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
    });

    // Type guard: ensure decoded token has required fields
    if (
      typeof decoded === "object" &&
      decoded !== null &&
      "id" in decoded &&
      "email" in decoded &&
      typeof decoded.id === "string" &&
      typeof decoded.email === "string" &&
      decoded.id.length > 0 &&
      decoded.email.length > 0
    ) {
      return {
        id: decoded.id,
        email: decoded.email,
        iat: typeof decoded.iat === "number" ? decoded.iat : 0,
        exp: typeof decoded.exp === "number" ? decoded.exp : 0,
      };
    }

    throw new JWTAuthError(401, "Invalid token payload structure");
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new JWTAuthError(401, "Token has expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new JWTAuthError(401, "Invalid token signature");
    }
    if (error instanceof JWTAuthError) {
      throw error
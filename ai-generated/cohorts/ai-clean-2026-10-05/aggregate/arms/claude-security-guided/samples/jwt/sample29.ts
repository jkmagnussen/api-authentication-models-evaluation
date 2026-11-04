```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Initialize Anthropic client
const anthropic = new Anthropic();

// Type definitions for JWT payload
interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Extend Express Request to include user data
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// Configuration with secure defaults
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || "your-super-secret-key-change-in-prod",
  expiresIn: "1h",
  algorithm: "HS256" as const,
  issuer: "auth-service",
  audience: "api",
};

// Validation schemas
const validateTokenFormat = (token: string): boolean => {
  // JWT format: header.payload.signature
  const parts = token.split(".");
  if (parts.length !== 3) {
    return false;
  }
  // Basic validation that each part is base64url encoded
  const base64urlRegex = /^[A-Za-z0-9_-]*$/;
  return parts.every((part) => base64urlRegex.test(part));
};

const validatePayload = (payload: unknown): payload is JWTPayload => {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  const obj = payload as Record<string, unknown>;

  // Check required fields
  if (typeof obj.userId !== "string" || obj.userId.length === 0) {
    return false;
  }

  // Validate email format
  if (
    typeof obj.email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(obj.email)
  ) {
    return false;
  }

  // Validate timestamps if present
  if (obj.iat !== undefined && typeof obj.iat !== "number") {
    return false;
  }
  if (obj.exp !== undefined && typeof obj.exp !== "number") {
    return false;
  }

  return true;
};

// JWT Authentication Middleware
export const jwtAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || typeof authHeader !== "string") {
      res.status(401).json({
        error: "Unauthorized",
        message: "Missing or invalid authorization header",
      });
      return;
    }

    // Extract Bearer token
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid authorization header format",
      });
      return;
    }

    const token = parts[1];

    // Validate token format before attempting to verify
    if (!validateTokenFormat(token)) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid token format",
      });
      return;
    }

    // Verify and decode JWT
    const decoded = jwt.verify(token, JWT_CONFIG.secret, {
      algorithms: [JWT_CONFIG.algorithm],
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
    });
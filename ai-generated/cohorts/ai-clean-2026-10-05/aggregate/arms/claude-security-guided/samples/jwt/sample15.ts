```typescript
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Types for JWT payload
interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// Configuration with secure defaults
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
  expiresIn: "1h",
  algorithm: "HS256" as const,
  issuer: "your-app",
  audience: "your-app-users",
};

// Token validation errors
class TokenValidationError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "TokenValidationError";
  }
}

/**
 * Generate a JWT token with secure defaults
 */
export const generateToken = (payload: JWTPayload): string => {
  try {
    // Validate payload
    if (!payload.userId || !payload.email) {
      throw new Error("Invalid payload: userId and email are required");
    }

    // Sanitize payload to prevent injection
    const sanitizedPayload: JWTPayload = {
      userId: String(payload.userId).substring(0, 255),
      email: String(payload.email).substring(0, 255),
    };

    const token = jwt.sign(sanitizedPayload, JWT_CONFIG.secret, {
      expiresIn: JWT_CONFIG.expiresIn,
      algorithm: JWT_CONFIG.algorithm,
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
    });

    return token;
  } catch (error) {
    throw new Error(`Token generation failed: ${error}`);
  }
};

/**
 * Verify and decode JWT token with strict validation
 */
export const verifyToken = (token: string): JWTPayload => {
  try {
    // Input validation - fail closed if token is invalid
    if (!token || typeof token !== "string") {
      throw new TokenValidationError(
        "Token must be a non-empty string",
        "INVALID_TOKEN_FORMAT"
      );
    }

    // Check token length to prevent DoS
    if (token.length > 10000) {
      throw new TokenValidationError(
        "Token exceeds maximum length",
        "TOKEN_TOO_LONG"
      );
    }

    // Verify token with strict options
    const decoded = jwt.verify(token, JWT_CONFIG.secret, {
      algorithms: [JWT_CONFIG.algorithm],
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
    }) as JWTPayload;

    // Validate decoded payload structure
    if (!decoded.userId || !decoded.email) {
      throw new TokenValidationError(
        "Token payload missing required fields",
        "INVALID_PAYLOAD"
      );
    }

    // Type validation
    if (typeof decoded.userId !== "string" || typeof decoded.email !== "string") {
      throw new TokenValidationError(
        "Token payload fields have invalid types",
        "INVALID_PAYLOAD_TYPES"
      );
    }

    return decoded;
  } catch (error) {
    if (error instanceof TokenValidationError) {
      throw error;
    }

    if (error instanceof jwt.TokenExpiredError) {
      throw new TokenValidationError(
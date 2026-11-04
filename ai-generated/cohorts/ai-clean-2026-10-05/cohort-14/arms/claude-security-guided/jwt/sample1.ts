```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// Initialize Anthropic client
const client = new Anthropic();

// Types for JWT authentication
interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

interface AuthRequest extends Request {
  user?: JWTPayload;
}

// Secure defaults configuration
const JWT_CONFIG = {
  expiresIn: "1h", // Short expiration time
  algorithm: "HS256" as const,
  issuer: "secure-api",
  audience: "api-clients",
};

// Secret key generation (in production, load from secure environment)
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");

// Validate JWT token format and signature
export const validateJWTToken = async (token: string): Promise<JWTPayload | null> => {
  if (!token || typeof token !== "string") {
    console.error("Invalid token format: not a string");
    return null;
  }

  // Check token format (should have 3 parts separated by dots)
  const parts = token.split(".");
  if (parts.length !== 3) {
    console.error("Invalid token format: incorrect number of parts");
    return null;
  }

  // Check token length limits to prevent DoS
  if (token.length > 2048) {
    console.error("Token exceeds maximum length");
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [JWT_CONFIG.algorithm],
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
      maxAge: "1h",
    }) as JWTPayload;

    // Validate required fields
    if (!decoded.userId || !decoded.email) {
      console.error("Invalid token payload: missing required fields");
      return null;
    }

    // Validate userId and email format
    if (typeof decoded.userId !== "string" || decoded.userId.length === 0) {
      console.error("Invalid userId in token");
      return null;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(decoded.email)) {
      console.error("Invalid email format in token");
      return null;
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.error("Token expired");
    } else if (error instanceof jwt.JsonWebTokenError) {
      console.error("Invalid token signature or format");
    } else {
      console.error("Token validation error:", error);
    }
    return null;
  }
};

// Extract token from Authorization header
export const extractToken = (authHeader: string | undefined): string | null => {
  if (!authHeader || typeof authHeader !== "string") {
    return null;
  }

  const parts = authHeader.split(" ");

  // Validate Bearer scheme
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    console.error("Invalid Authorization header format");
    return null;
  }

  const token = parts[1];

  // Additional validation
  if (!token || token.length === 0) {
    console.error("Empty token provided");
    return null;
  }

  return token;
};

// Main JWT authentication
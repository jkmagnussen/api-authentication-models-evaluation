```typescript
import express, { Express, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// Types
interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

// Configuration with secure defaults
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");
const JWT_EXPIRY = process.env.JWT_EXPIRY || "1h";
const TOKEN_REFRESH_WINDOW = 5 * 60 * 1000; // 5 minutes in milliseconds

// Validation utilities
function validateJWTSecret(secret: string): boolean {
  if (!secret || typeof secret !== "string") {
    return false;
  }
  // Require minimum 32 bytes (256 bits) for security
  if (Buffer.from(secret).length < 32) {
    console.warn("JWT_SECRET is less than 32 bytes - security risk");
    return false;
  }
  return true;
}

function validateToken(token: unknown): boolean {
  if (!token || typeof token !== "string") {
    return false;
  }
  // Check basic JWT format (three parts separated by dots)
  const parts = token.split(".");
  if (parts.length !== 3) {
    return false;
  }
  // Validate each part is base64url encoded
  for (const part of parts) {
    if (!part || !/^[A-Za-z0-9_-]+$/.test(part)) {
      return false;
    }
  }
  return true;
}

function validatePayload(payload: unknown): payload is JWTPayload {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const p = payload as Record<string, unknown>;

  // Validate required fields
  if (typeof p.userId !== "string" || !p.userId.trim()) {
    return false;
  }

  if (typeof p.email !== "string" || !p.email.trim()) {
    return false;
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(p.email)) {
    return false;
  }

  return true;
}

// JWT generation with secure defaults
export function generateToken(payload: JWTPayload): string {
  const tokenPayload: JWTPayload & { iat: number; exp: number } = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (3600 * 24), // Default 24 hours in seconds
  };

  try {
    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: JWT_EXPIRY,
      issuer: "auth-service",
      audience: "api",
    });

    return token;
  } catch (error) {
    console.error("Token generation failed:", error);
    throw new Error("Failed to generate authentication token");
  }
}

// Secure token verification with fail-closed approach
export function verifyToken(token: string): JWTPayload | null {
  // Input validation - fail closed
  if (!validateToken(token)) {
    console.warn("Invalid token format detected");
    return null;
  }

  // Secret validation -
```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";

// Types for JWT payload
interface JWTPayload {
  sub: string;
  iat: number;
  exp: number;
  iss: string;
}

interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

// Initialize Anthropic client
const client = new Anthropic();

// Secure defaults
const SECURE_DEFAULTS = {
  tokenExpiry: 3600, // 1 hour in seconds
  issuer: "secure-api",
  algorithm: "HS256",
  maxTokenLength: 1000,
  clockTolerance: 30, // 30 seconds for clock skew
};

// Validate JWT format
export function validateJWTFormat(token: string): boolean {
  if (!token || typeof token !== "string") {
    return false;
  }

  if (token.length > SECURE_DEFAULTS.maxTokenLength) {
    return false;
  }

  // JWT format: header.payload.signature
  const parts = token.split(".");
  if (parts.length !== 3) {
    return false;
  }

  // Validate each part is valid base64url
  for (const part of parts) {
    if (!part || !/^[A-Za-z0-9_-]+$/.test(part)) {
      return false;
    }
  }

  return true;
}

// Decode JWT without verification (for demonstration)
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    // Decode payload (second part)
    const payload = parts[1];
    const decoded = Buffer.from(payload, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded);

    // Validate payload structure
    if (
      !parsed.sub ||
      typeof parsed.sub !== "string" ||
      !parsed.iat ||
      !parsed.exp ||
      typeof parsed.iat !== "number" ||
      typeof parsed.exp !== "number"
    ) {
      return null;
    }

    return {
      sub: parsed.sub,
      iat: parsed.iat,
      exp: parsed.exp,
      iss: parsed.iss || "",
    };
  } catch (error) {
    // Fail closed on any parsing error
    return null;
  }
}

// Validate JWT claims
export function validateJWTClaims(payload: JWTPayload): boolean {
  const now = Math.floor(Date.now() / 1000);

  // Check expiration with clock tolerance
  if (payload.exp < now - SECURE_DEFAULTS.clockTolerance) {
    return false;
  }

  // Check issued at time (prevent future tokens)
  if (payload.iat > now + SECURE_DEFAULTS.clockTolerance) {
    return false;
  }

  // Validate issuer matches expected value
  if (payload.iss !== SECURE_DEFAULTS.issuer) {
    return false;
  }

  // Validate subject is not empty
  if (!payload.sub || payload.sub.trim().length === 0) {
    return false;
  }

  return true;
}

// Main JWT authentication middleware
export function jwtAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    // Extract authorization header
    const auth
```typescript
import express, { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

// Secure defaults and configuration
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-change-this";
const JWT_ALGORITHM = "HS256";
const TOKEN_EXPIRY = "1h";
const MAX_TOKEN_LENGTH = 500;
const BEARER_SCHEME = "Bearer";

// Type definitions for authenticated requests
interface AuthRequest extends Request {
  user?: JwtPayload;
}

interface TokenPayload extends JwtPayload {
  userId: string;
  email: string;
  role: string;
}

// Validation helper - fail closed approach
function validateTokenFormat(token: string): boolean {
  // Check token length to prevent DoS attacks
  if (!token || token.length > MAX_TOKEN_LENGTH) {
    return false;
  }

  // Validate token structure (should have 3 parts separated by dots)
  const parts = token.split(".");
  if (parts.length !== 3) {
    return false;
  }

  // Validate that each part is valid base64url
  for (const part of parts) {
    if (!isValidBase64Url(part)) {
      return false;
    }
  }

  return true;
}

function isValidBase64Url(str: string): boolean {
  // Base64url alphabet: A-Z, a-z, 0-9, -, _
  const base64urlRegex = /^[A-Za-z0-9_-]+$/;
  return base64urlRegex.test(str);
}

function validatePayload(payload: unknown): payload is TokenPayload {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  const p = payload as Record<string, unknown>;

  // Validate required fields with strict type checking
  if (typeof p.userId !== "string" || p.userId.length === 0) {
    return false;
  }

  if (typeof p.email !== "string" || !isValidEmail(p.email)) {
    return false;
  }

  if (typeof p.role !== "string" || p.role.length === 0) {
    return false;
  }

  return true;
}

function isValidEmail(email: string): boolean {
  // Simple email validation - in production use a library like email-validator
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// JWT Authentication Middleware
export function jwtAuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    // Extract authorization header
    const authHeader = req.headers.authorization;

    // Fail closed: missing header
    if (!authHeader) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Missing authorization header",
      });
      return;
    }

    // Validate header format
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== BEARER_SCHEME) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid authorization header format",
      });
      return;
    }

    const token = parts[1];

    // Validate token format
    if (!validateTokenFormat(token)) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid token format",
```typescript
import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Type definitions
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
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const JWT_EXPIRY = process.env.JWT_EXPIRY || '1h';
const TOKEN_HEADER = 'authorization';
const TOKEN_PREFIX = 'Bearer ';
const MAX_TOKEN_LENGTH = 1000;

// Validate JWT secret strength
function validateJWTSecret(secret: string): boolean {
  if (!secret || secret.length < 32) {
    console.error('Warning: JWT secret is weak. Use a strong secret in production.');
    return false;
  }
  return true;
}

// Sanitize and validate JWT token
function sanitizeToken(token: string): string | null {
  if (!token || typeof token !== 'string') {
    return null;
  }

  // Check token length to prevent attacks
  if (token.length > MAX_TOKEN_LENGTH) {
    return null;
  }

  // Remove whitespace
  const sanitized = token.trim();

  // Validate JWT format (three parts separated by dots)
  const parts = sanitized.split('.');
  if (parts.length !== 3) {
    return null;
  }

  // Validate that each part is base64url encoded
  const base64UrlRegex = /^[A-Za-z0-9_-]*$/;
  if (!parts.every(part => base64UrlRegex.test(part))) {
    return null;
  }

  return sanitized;
}

// Extract and validate token from request header
function extractToken(req: AuthenticatedRequest): string | null {
  const authHeader = req.get(TOKEN_HEADER);

  if (!authHeader) {
    return null;
  }

  if (!authHeader.startsWith(TOKEN_PREFIX)) {
    return null;
  }

  const token = authHeader.slice(TOKEN_PREFIX.length);
  return sanitizeToken(token);
}

// Verify and decode JWT token
function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Validate required fields
    if (!decoded.userId || typeof decoded.userId !== 'string') {
      return null;
    }

    if (!decoded.email || typeof decoded.email !== 'string') {
      return null;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(decoded.email)) {
      return null;
    }

    return decoded;
  } catch (error) {
    // Fail closed - any verification error returns null
    return null;
  }
}

// JWT authentication middleware
export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // Extract token from request
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid authorization token'
    });
    return;
  }

  // Verify and decode token
  const payload = verify
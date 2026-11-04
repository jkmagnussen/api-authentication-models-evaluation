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
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex'),
  expiresIn: '1h',
  algorithm: 'HS256' as const,
  issuer: 'auth-service',
  audience: 'api-users',
};

// Validation helper with strict input checking
export function validateTokenFormat(token: string): boolean {
  if (typeof token !== 'string') {
    return false;
  }

  // JWT format: header.payload.signature (exactly 3 parts separated by dots)
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  // Check each part is valid base64url
  const base64urlRegex = /^[A-Za-z0-9_-]+$/;
  return parts.every(part => {
    if (part.length === 0) {
      return false;
    }
    return base64urlRegex.test(part);
  });
}

// Validate JWT payload structure
export function validateJWTPayload(payload: unknown): payload is JWTPayload {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  const obj = payload as Record<string, unknown>;

  // Check required fields
  if (typeof obj.userId !== 'string' || obj.userId.length === 0) {
    return false;
  }

  if (typeof obj.email !== 'string' || !obj.email.includes('@')) {
    return false;
  }

  // Optional: validate email format more strictly
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(obj.email)) {
    return false;
  }

  return true;
}

// Generate JWT token with secure defaults
export function generateToken(payload: JWTPayload): string {
  // Ensure payload has required fields
  if (!validateJWTPayload(payload)) {
    throw new Error('Invalid payload for token generation');
  }

  const tokenPayload: JWTPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(tokenPayload, JWT_CONFIG.secret, {
    expiresIn: JWT_CONFIG.expiresIn,
    algorithm: JWT_CONFIG.algorithm,
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience,
  });
}

// Verify JWT token with strict validation
export function verifyToken(token: string): JWTPayload {
  // Fail closed: validate token format first
  if (!validateTokenFormat(token)) {
    throw new Error('Invalid token format');
  }

  try {
    const decoded = jwt.verify(token, JWT_CONFIG.secret, {
      algorithms: [JWT_CONFIG.algorithm],
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
    });

    // Additional validation of decoded payload
    if (!validateJWTPayload(decoded)) {
      throw new Error('Invalid token payload structure');
    }

    return decoded;
  } catch
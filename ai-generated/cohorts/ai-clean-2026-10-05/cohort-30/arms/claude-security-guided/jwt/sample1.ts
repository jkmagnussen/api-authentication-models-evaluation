```typescript
import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Secure defaults configuration
const JWT_CONFIG = {
  algorithm: 'HS256' as const,
  expiresIn: '1h',
  issuer: 'secure-app',
  audience: 'secure-api',
  maxTokenAge: 3600, // 1 hour in seconds
} as const;

// Extend Express Request to include user data
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; iat: number; exp: number };
      token?: string;
    }
  }
}

// Input validation helpers with strict validation
function validateJwtSecret(secret: unknown): string {
  if (typeof secret !== 'string') {
    throw new Error('JWT secret must be a string');
  }
  if (secret.length < 32) {
    throw new Error('JWT secret must be at least 32 characters long');
  }
  return secret;
}

function validateTokenFormat(token: unknown): string {
  if (typeof token !== 'string') {
    throw new Error('Token must be a string');
  }
  // JWT format: header.payload.signature (3 parts separated by dots)
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }
  // Validate each part is base64url encoded
  const base64urlRegex = /^[A-Za-z0-9_-]*$/;
  if (!parts.every((part) => base64urlRegex.test(part))) {
    throw new Error('Invalid token encoding');
  }
  return token;
}

function validateAuthHeader(authHeader: unknown): string {
  if (typeof authHeader !== 'string') {
    throw new Error('Authorization header must be a string');
  }
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    throw new Error('Authorization header must be in format: Bearer <token>');
  }
  return parts[1];
}

// JWT creation with secure defaults
export function createToken(payload: { id: string; email: string }, secret: string): string {
  try {
    const validatedSecret = validateJwtSecret(secret);

    // Validate payload
    if (!payload.id || typeof payload.id !== 'string') {
      throw new Error('Payload must contain a valid id');
    }
    if (!payload.email || typeof payload.email !== 'string' || !payload.email.includes('@')) {
      throw new Error('Payload must contain a valid email');
    }

    const token = jwt.sign(payload, validatedSecret, {
      algorithm: JWT_CONFIG.algorithm,
      expiresIn: JWT_CONFIG.expiresIn,
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
      jwtid: crypto.randomBytes(16).toString('hex'), // Unique token ID
      notBefore: 0, // Token is valid immediately
    });

    return token;
  } catch (error) {
    throw new Error(`Token creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// JWT verification with strict validation
function verifyToken(token: string, secret: string): { id: string; email: string; iat: number; exp: number } {
  try {
    const validatedSecret = validateJwtSecret(secret);
    const validatedToken = validateTokenFormat(token);
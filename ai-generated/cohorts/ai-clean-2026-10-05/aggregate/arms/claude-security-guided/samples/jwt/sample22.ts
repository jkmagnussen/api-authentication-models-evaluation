```typescript
import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Secure defaults
const DEFAULT_TOKEN_EXPIRY = '1h';
const DEFAULT_ALGORITHM = 'HS256';
const MAX_TOKEN_LENGTH = 1000; // Prevent extremely large tokens
const MAX_SECRET_LENGTH = 512;
const MIN_SECRET_LENGTH = 32;

// Custom error types for security
class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Request interface extension for JWT payload
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        iat?: number;
        exp?: number;
      };
    }
  }
}

// Validate JWT secret
export function validateSecret(secret: string): void {
  if (!secret || typeof secret !== 'string') {
    throw new ValidationError('Secret must be a non-empty string');
  }

  if (secret.length < MIN_SECRET_LENGTH) {
    throw new ValidationError(
      `Secret must be at least ${MIN_SECRET_LENGTH} characters long`
    );
  }

  if (secret.length > MAX_SECRET_LENGTH) {
    throw new ValidationError(
      `Secret must not exceed ${MAX_SECRET_LENGTH} characters`
    );
  }
}

// Validate token format and length
export function validateTokenFormat(token: string): void {
  if (!token || typeof token !== 'string') {
    throw new ValidationError('Token must be a non-empty string');
  }

  if (token.length > MAX_TOKEN_LENGTH) {
    throw new ValidationError('Token exceeds maximum allowed length');
  }

  // JWT format: header.payload.signature
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new ValidationError('Invalid token format');
  }

  // Validate each part is base64url encoded
  const base64UrlRegex = /^[A-Za-z0-9_-]+$/;
  for (const part of parts) {
    if (!part || !base64UrlRegex.test(part)) {
      throw new ValidationError('Invalid token encoding');
    }
  }
}

// Create JWT token with secure defaults
export function createToken(
  payload: { id: string; email: string },
  secret: string,
  expiresIn: string = DEFAULT_TOKEN_EXPIRY
): string {
  try {
    validateSecret(secret);

    // Validate payload
    if (!payload || typeof payload !== 'object') {
      throw new ValidationError('Payload must be an object');
    }

    if (!payload.id || typeof payload.id !== 'string') {
      throw new ValidationError('Payload must contain a valid id');
    }

    if (!payload.email || typeof payload.email !== 'string') {
      throw new ValidationError('Payload must contain a valid email');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(payload.email)) {
      throw new ValidationError('Invalid email format');
    }

    return jwt.sign(payload, secret, {
      algorithm: DEFAULT_ALGORITHM,
      expiresIn,
      issuer: 'auth-service',
      subject: payload.id,
    });
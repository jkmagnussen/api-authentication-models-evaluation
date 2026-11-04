```typescript
import express, { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload, VerifyOptions } from 'jsonwebtoken';

// Define authenticated request type
interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  token?: string;
}

// Configuration constants with secure defaults
const CONFIG = {
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '1h',
  TOKEN_HEADER_NAME: 'authorization',
  TOKEN_PREFIX: 'Bearer ',
  MAX_TOKEN_LENGTH: 1000, // Prevent excessively long tokens
  REQUIRED_CLAIMS: ['sub', 'iat'], // Required JWT claims
};

// Validation error class for clear error handling
class ValidationError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Extract and validate token from request headers
export const extractToken = (req: AuthenticatedRequest): string => {
  const authHeader = req.headers[CONFIG.TOKEN_HEADER_NAME];

  // Fail closed: require authorization header
  if (!authHeader) {
    throw new ValidationError('Missing authorization header', 401);
  }

  // Validate header is a string
  if (typeof authHeader !== 'string') {
    throw new ValidationError('Invalid authorization header format', 401);
  }

  // Validate token length to prevent DoS
  if (authHeader.length > CONFIG.MAX_TOKEN_LENGTH) {
    throw new ValidationError('Token exceeds maximum length', 401);
  }

  // Validate Bearer prefix
  if (!authHeader.startsWith(CONFIG.TOKEN_PREFIX)) {
    throw new ValidationError('Token must use Bearer scheme', 401);
  }

  const token = authHeader.slice(CONFIG.TOKEN_PREFIX.length).trim();

  // Validate token is not empty
  if (!token || token.length === 0) {
    throw new ValidationError('Empty token provided', 401);
  }

  // Validate token contains expected JWT structure (3 parts separated by dots)
  if (token.split('.').length !== 3) {
    throw new ValidationError('Invalid token format', 401);
  }

  return token;
};

// Validate JWT claims
export const validateClaims = (payload: JwtPayload): void => {
  // Check all required claims are present
  for (const claim of CONFIG.REQUIRED_CLAIMS) {
    if (!(claim in payload)) {
      throw new ValidationError(`Missing required claim: ${claim}`, 401);
    }
  }

  // Validate iat (issued at) is a number
  if (typeof payload.iat !== 'number') {
    throw new ValidationError('Invalid iat claim', 401);
  }

  // Validate iat is not in the future (within 60 second clock skew tolerance)
  const now = Math.floor(Date.now() / 1000);
  if (payload.iat > now + 60) {
    throw new ValidationError('Token issued in the future', 401);
  }

  // Validate sub (subject) is not empty
  if (typeof payload.sub !== 'string' || payload.sub.trim().length === 0) {
    throw new ValidationError('Invalid subject claim', 401);
  }
};

// Verify and decode JWT token
export const verifyToken = (token: string): JwtPayload => {
  try {
    const verifyOptions: VerifyOptions = {
      algorithms: ['HS
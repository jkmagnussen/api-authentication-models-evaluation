```typescript
import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';

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
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '1h';
const TOKEN_ALGORITHM = 'HS256';
const MAX_TOKEN_LENGTH = 10000; // Prevent extremely large tokens
const BEARER_PREFIX = 'Bearer ';

// Validation middleware for token format
export const validateTokenFormat = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  // Fail closed: reject if no auth header
  if (!authHeader) {
    res.status(401).json({ error: 'Missing authorization header' });
    return;
  }

  // Validate token format
  if (!authHeader.startsWith(BEARER_PREFIX)) {
    res.status(401).json({ error: 'Invalid authorization header format' });
    return;
  }

  const token = authHeader.substring(BEARER_PREFIX.length);

  // Validate token length to prevent DoS
  if (token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
    res.status(401).json({ error: 'Invalid token length' });
    return;
  }

  // Validate token structure (JWT has 3 parts separated by dots)
  const tokenParts = token.split('.');
  if (tokenParts.length !== 3) {
    res.status(401).json({ error: 'Malformed token' });
    return;
  }

  // Store token for next middleware
  req.user = { userId: '', email: '' }; // Initialize to avoid undefined
  (req as any).token = token;
  next();
};

// JWT verification middleware
export const verifyJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const token = (req as any).token;

  if (!token) {
    res.status(401).json({ error: 'Token not found' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [TOKEN_ALGORITHM],
      issuer: process.env.JWT_ISSUER || 'your-app',
    }) as JWTPayload;

    // Validate required claims
    if (!decoded.userId || !decoded.email) {
      res.status(401).json({ error: 'Invalid token claims' });
      return;
    }

    // Additional validation: ensure userId and email are strings
    if (typeof decoded.userId !== 'string' || typeof decoded.email !== 'string') {
      res.status(401).json({ error: 'Invalid claim types' });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(decoded.email)) {
      res.status(401).json({ error: 'Invalid email format in token' });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    // Fail closed: reject on any
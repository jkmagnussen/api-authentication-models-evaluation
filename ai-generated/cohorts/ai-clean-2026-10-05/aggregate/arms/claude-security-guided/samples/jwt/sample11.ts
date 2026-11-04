```typescript
import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// Environment variables with secure defaults
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '1h';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Validation schemas for untrusted input
const TokenPayloadSchema = z.object({
  userId: z.string().min(1).max(255),
  email: z.string().email(),
  role: z.enum(['user', 'admin']).default('user'),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

const LoginRequestSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
});

type TokenPayload = z.infer<typeof TokenPayloadSchema>;
type LoginRequest = z.infer<typeof LoginRequestSchema>;

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      token?: string;
    }
  }
}

// JWT authentication middleware
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers['authorization'];
    
    // Fail closed if no token provided
    if (!authHeader) {
      res.status(401).json({ error: 'No authorization token provided' });
      return;
    }

    // Validate token format (Bearer scheme)
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      res.status(401).json({ error: 'Invalid authorization header format' });
      return;
    }

    const token = parts[1];

    // Validate token is a string and not excessively long
    if (typeof token !== 'string' || token.length > 1000) {
      res.status(401).json({ error: 'Invalid token format' });
      return;
    }

    // Verify and decode token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Validate decoded payload structure
    const validatedPayload = TokenPayloadSchema.parse(decoded);

    // Attach user info to request
    req.user = validatedPayload;
    req.token = token;

    next();
  } catch (error) {
    // Fail closed on any validation error
    if (error instanceof z.ZodError) {
      res.status(401).json({ error: 'Invalid token payload' });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token has expired' });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    // Generic error handling
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Optional: Role-based access control middleware
export const authorizeRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'User not
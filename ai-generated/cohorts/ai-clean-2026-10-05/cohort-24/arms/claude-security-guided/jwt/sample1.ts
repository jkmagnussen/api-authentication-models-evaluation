```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";

const client = new Anthropic();

// Define request types with strict validation
const authHeaderSchema = z.string().regex(/^Bearer\s+\S+$/);
const tokenPayloadSchema = z.object({
  sub: z.string().min(1),
  iat: z.number().int().positive(),
  exp: z.number().int().positive(),
});

type TokenPayload = z.infer<typeof tokenPayloadSchema>;

// Secure defaults and configuration
const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret-in-production";
const TOKEN_EXPIRY = "1h";
const ALGORITHM = "HS256";

// Augment Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

// JWT authentication middleware with secure defaults
export const jwtAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  // Fail closed: missing or invalid header
  if (!authHeader) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Missing authorization header",
    });
    return;
  }

  // Validate header format strictly
  const headerValidation = authHeaderSchema.safeParse(authHeader);
  if (!headerValidation.success) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Invalid authorization header format",
    });
    return;
  }

  // Extract token
  const token = authHeader.split(" ")[1];

  // Validate token format before processing
  if (!token || token.length === 0) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Empty token",
    });
    return;
  }

  // Verify and decode JWT
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [ALGORITHM as jwt.Algorithm],
    });

    // Validate decoded payload structure
    const payloadValidation = tokenPayloadSchema.safeParse(decoded);
    if (!payloadValidation.success) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid token payload",
      });
      return;
    }

    // Validate expiration time
    const now = Math.floor(Date.now() / 1000);
    if (payloadValidation.data.exp <= now) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Token has expired",
      });
      return;
    }

    // Attach validated user to request
    req.user = payloadValidation.data;
    next();
  } catch (error) {
    // Fail closed on any JWT verification error
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Token has expired",
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: "Unauthorized",
        message: "Invalid token",
      });
    } else {
      res.status(500).json({
        error: "Internal server error",
        message: "Token verification failed",
      });
    }
  }
};

// Generate JWT token with secure defaults
export const
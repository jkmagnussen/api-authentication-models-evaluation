```typescript
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Environment variables with secure defaults
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || "1h";
const TOKEN_ALGORITHM = "HS256";

// Interface for decoded JWT payload
interface DecodedToken {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// Extend Express Request to include user information
declare global {
  namespace Express {
    interface Request {
      user?: DecodedToken;
    }
  }
}

// Middleware to verify JWT token
export const verifyJWT = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    // Validate that authorization header exists and follows Bearer scheme
    if (!authHeader) {
      res.status(401).json({ error: "Missing authorization header" });
      return;
    }

    // Validate Bearer token format
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
      res.status(401).json({ error: "Invalid authorization header format" });
      return;
    }

    const token = parts[1];

    // Validate token is not empty
    if (!token || token.trim() === "") {
      res.status(401).json({ error: "Token is empty" });
      return;
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: [TOKEN_ALGORITHM],
    }) as DecodedToken;

    // Validate decoded token has required fields
    if (!decoded.userId || !decoded.email) {
      res.status(401).json({ error: "Invalid token payload" });
      return;
    }

    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    // Fail closed: reject with 401 for any verification error
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Token has expired" });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: "Invalid token" });
    } else {
      res.status(401).json({ error: "Authentication failed" });
    }
  }
};

// Function to generate JWT token
export const generateToken = (userId: string, email: string): string => {
  // Validate input
  if (!userId || typeof userId !== "string" || userId.trim() === "") {
    throw new Error("Invalid userId");
  }
  if (!email || typeof email !== "string" || !isValidEmail(email)) {
    throw new Error("Invalid email format");
  }

  const payload = {
    userId: userId.trim(),
    email: email.trim().toLowerCase(),
  };

  return jwt.sign(payload, JWT_SECRET, {
    algorithm: TOKEN_ALGORITHM,
    expiresIn: JWT_EXPIRATION,
  });
};

// Email validation helper
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Middleware to check if user is authenticated (after verifyJWT)
export const requireAuth = (
  req: Request,
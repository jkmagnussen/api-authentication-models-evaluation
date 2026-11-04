```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const client = new Anthropic();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";
const TOKEN_EXPIRY = "1h";

export const generateToken = (
  userId: string,
  email: string
): { token: string; expiresIn: string } => {
  const token = jwt.sign(
    { id: userId, email: email },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY, algorithm: "HS256" }
  );
  return { token, expiresIn: TOKEN_EXPIRY };
};

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers["authorization"];

  // Fail closed: reject if no authorization header
  if (!authHeader) {
    res.status(401).json({ error: "Missing authorization header" });
    return;
  }

  // Validate header format: "Bearer <token>"
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    res.status(401).json({ error: "Invalid authorization header format" });
    return;
  }

  const token = parts[1];

  // Validate token format before processing
  if (!token || typeof token !== "string" || token.length === 0) {
    res.status(401).json({ error: "Invalid token format" });
    return;
  }

  try {
    // Verify with strict algorithm checking
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    });

    // Validate decoded payload structure
    if (
      typeof decoded === "object" &&
      decoded !== null &&
      "id" in decoded &&
      "email" in decoded
    ) {
      req.user = {
        id: String(decoded.id),
        email: String(decoded.email),
      };
      next();
    } else {
      res.status(401).json({ error: "Invalid token payload" });
    }
  } catch (error) {
    // Fail closed: reject on any verification error
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: "Token has expired" });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: "Invalid token" });
    } else {
      res.status(401).json({ error: "Token verification failed" });
    }
  }
};

export const validateLoginInput = (
  email: string,
  password: string
): { valid: boolean; error?: string } => {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return { valid: false, error: "Invalid email format" };
  }

  // Validate password requirements
  if (!password || password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters" };
  }

  // Check for suspicious patterns
  if (password.length > 128) {
    return { valid: false, error: "Password is too long" };
  }
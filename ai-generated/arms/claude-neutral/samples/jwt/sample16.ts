```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction, Express } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

const client = new Anthropic();

// Types for JWT payload
interface TokenPayload extends JwtPayload {
  userId: string;
  email: string;
  role: string;
}

// Extend Express Request to include decoded token
declare global {
  namespace Express {
    interface Request {
      decodedToken?: TokenPayload;
    }
  }
}

const SECRET_KEY = process.env.JWT_SECRET || "your-secret-key-change-in-prod";

export function validateJWTMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    res.status(401).json({ error: "No authorization header provided" });
    return;
  }

  const tokenParts = authorizationHeader.split(" ");
  if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
    res.status(401).json({ error: "Invalid authorization header format" });
    return;
  }

  const token = tokenParts[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as TokenPayload;
    req.decodedToken = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function generateAuthToken(payload: {
  userId: string;
  email: string;
  role: string;
}): string {
  const tokenPayload: TokenPayload = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: "24h" });
}

export function requireAdminRole(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.decodedToken) {
    res.status(401).json({ error: "No token found" });
    return;
  }

  if (req.decodedToken.role !== "admin") {
    res.status(403).json({ error: "Admin role required" });
    return;
  }

  next();
}

export function requireUserRole(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.decodedToken) {
    res.status(401).json({ error: "No token found" });
    return;
  }

  if (req.decodedToken.role !== "user" && req.decodedToken.role !== "admin") {
    res.status(403).json({ error: "User role required" });
    return;
  }

  next();
}

async function generateSecurityAnalysis(
  tokenPayload: TokenPayload
): Promise<string> {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Analyze this JWT token payload for security implications and provide recommendations. Token data: userId=${tokenPayload.userId}, role=${tokenPayload.role}, issued=${new Date(tokenPayload.iat! * 1000).toISOString()}. What are
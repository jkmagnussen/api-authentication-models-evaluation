```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";

const client = new Anthropic();

interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

const JWT_SECRET = "your-secret-key-change-this";
const TOKEN_EXPIRY = 3600; // 1 hour in seconds

function generateJWT(payload: Omit<JWTPayload, "iat" | "exp">): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" })
  ).toString("base64url");

  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + TOKEN_EXPIRY,
  };

  const encodedPayload = Buffer.from(JSON.stringify(tokenPayload)).toString(
    "base64url"
  );

  const crypto = require("crypto");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${encodedPayload}`)
    .digest("base64url");

  return `${header}.${encodedPayload}.${signature}`;
}

function verifyJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const [header, payload, signature] = parts;

    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest("base64url");

    if (signature !== expectedSignature) {
      return null;
    }

    const decodedPayload = JSON.parse(
      Buffer.from(payload, "base64url").toString()
    ) as JWTPayload;

    const now = Math.floor(Date.now() / 1000);
    if (decodedPayload.exp < now) {
      return null;
    }

    return decodedPayload;
  } catch (error) {
    return null;
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  const payload = verifyJWT(token);
  if (!payload) {
    res.status(403).json({ error: "Invalid or expired token" });
    return;
  }

  req.user = payload;
  next();
};

export const generateTokenEndpoint = (
  req: Request,
  res: Response
): void => {
  const { userId, email } = req.body;

  if (!userId || !email) {
    res.status(400).json({ error: "userId and email are required" });
    return;
  }

  const token = generateJWT({ userId, email });
  res.json({ token });
};

export const protectedEndpoint = (req: Request, res: Response): void => {
  res.json({
    message: "Access granted to protected resource
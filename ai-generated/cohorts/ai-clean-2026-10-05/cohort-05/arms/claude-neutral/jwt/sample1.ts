```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Express, Request, Response, NextFunction } from "express";

const client = new Anthropic();

interface AuthRequest extends Request {
  userId?: string;
  token?: string;
}

interface TokenPayload {
  userId: string;
  iat: number;
  exp: number;
}

const JWT_SECRET = "your-secret-key-change-in-production";

function generateToken(userId: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" }))
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    userId,
    iat: now,
    exp: now + 3600,
  };

  const payloadEncoded = Buffer.from(JSON.stringify(payload))
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const crypto = require("crypto");
  const hmac = crypto.createHmac("sha256", JWT_SECRET);
  hmac.update(`${header}.${payloadEncoded}`);
  const signature = hmac
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${header}.${payloadEncoded}.${signature}`;
}

function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;

    const crypto = require("crypto");
    const hmac = crypto.createHmac("sha256", JWT_SECRET);
    hmac.update(`${headerB64}.${payloadB64}`);
    const expectedSignature = hmac
      .digest("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    if (signatureB64 !== expectedSignature) return null;

    const payloadJson = Buffer.from(
      payloadB64.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString();
    const payload = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;

    return payload;
  } catch {
    return null;
  }
}

export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access token required" });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(403).json({ error: "Invalid or expired token" });
    return;
  }

  req.userId = payload.userId;
  req.token = token;
  next();
}

export function setupAuthRoutes(app: Express): void {
  app.post("/auth/login", (req: Request, res: Response) => {
    const userId =
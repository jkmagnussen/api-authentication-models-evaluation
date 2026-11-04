```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";

const client = new Anthropic();

interface JWTPayload {
  sub: string;
  iat: number;
  exp: number;
  [key: string]: string | number;
}

interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export const generateJWTMiddleware = async (): Promise<string> => {
  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Generate a secure JWT authentication middleware implementation in TypeScript for Express.js. 
        
        Requirements:
        1. Use secure defaults (short token expiry, require Bearer prefix)
        2. Validate all untrusted input (token format, claims, signature)
        3. Fail closed - reject on any validation error
        4. Use a simple hardcoded secret for demo (note: use environment variables in production)
        5. Return only the middleware function code, no markdown, no explanation
        
        The middleware should:
        - Extract token from Authorization header
        - Validate token format (Bearer <token>)
        - Verify token signature and expiration
        - Decode and validate claims
        - Attach user to request if valid
        - Return 401 if invalid`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  return content.text;
};

// Secure JWT implementation with hardcoded secret for demo
const JWT_SECRET = "your-secret-key-change-in-production";
const TOKEN_EXPIRY_SECONDS = 3600; // 1 hour - short expiry for security

// Simple JWT implementation (in production, use jsonwebtoken library)
function verifyJWT(token: string): JWTPayload | null {
  try {
    // Validate token format
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    // Decode header
    const header = JSON.parse(
      Buffer.from(parts[0], "base64url").toString("utf-8")
    );
    if (header.alg !== "HS256") {
      return null;
    }

    // Decode payload
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8")
    );

    // Validate payload structure
    if (!payload.sub || typeof payload.sub !== "string") {
      return null;
    }
    if (!payload.iat || typeof payload.iat !== "number") {
      return null;
    }
    if (!payload.exp || typeof payload.exp !== "number") {
      return null;
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now) {
      return null;
    }

    // Verify signature (simplified - use crypto in production)
    const crypto = require("crypto");
    const signature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(parts[0] + "." + parts[1])
      .digest("base64url");

    if (signature !== parts[2]) {
      return null;
    }

    return payload;
  } catch {
    // Fail closed on any error
    return null;
  }
}

export const authMidd
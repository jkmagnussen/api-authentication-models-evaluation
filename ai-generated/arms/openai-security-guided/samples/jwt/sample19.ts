```typescript
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";

interface TokenPayload {
  sub: string;
  aud: string;
  iss: string;
  iat: number;
  exp: number;
  [key: string]: unknown;
}

interface AuthConfig {
  publicKey: string;
  expectedAudience: string;
  expectedIssuer: string;
  allowedAlgorithms: string[];
  maxTokenAge: number;
  clockTolerance: number;
}

interface AuthRequest extends Request {
  user?: TokenPayload;
}

const validateTokenStructure = (
  token: string
): { valid: boolean; error?: string } => {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return { valid: false, error: "Invalid token format" };
  }

  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64").toString("utf8")
    );
    if (!payload.exp || !payload.iat) {
      return { valid: false, error: "Missing required claims" };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid token payload" };
  }
};

const verifyTokenExpiry = (payload: TokenPayload, maxAge: number) => {
  const currentTime = Math.floor(Date.now() / 1000);
  const tokenAge = currentTime - payload.iat;

  if (tokenAge > maxAge) {
    throw new Error("Token age exceeds maximum allowed");
  }

  if (payload.exp && currentTime > payload.exp) {
    throw new Error("Token has expired");
  }
};

const validateAudienceClaim = (
  payload: TokenPayload,
  expectedAudience: string
) => {
  if (!payload.aud) {
    throw new Error("Missing audience claim");
  }

  const audiences = Array.isArray(payload.aud)
    ? payload.aud
    : [payload.aud];

  if (!audiences.includes(expectedAudience)) {
    throw new Error(
      `Invalid audience. Expected: ${expectedAudience}, Got: ${audiences.join(", ")}`
    );
  }
};

const validateIssuerClaim = (
  payload: TokenPayload,
  expectedIssuer: string
) => {
  if (!payload.iss) {
    throw new Error("Missing issuer claim");
  }

  if (payload.iss !== expectedIssuer) {
    throw new Error(
      `Invalid issuer. Expected: ${expectedIssuer}, Got: ${payload.iss}`
    );
  }
};

export const createAuthMiddleware = (config: AuthConfig) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing or invalid authorization header" });
    }

    const token = authHeader.substring(7);

    const structureValidation = validateTokenStructure(token);
    if (!structureValidation.valid) {
      return res.status(401).json({ error: structureValidation.error });
    }

    try {
      const decoded = jwt.verify(token, config.publicKey, {
        algorithms: config.allowedAlgorithms,
        audience: config.expectedAudience,
        issuer: config.expectedIssuer,
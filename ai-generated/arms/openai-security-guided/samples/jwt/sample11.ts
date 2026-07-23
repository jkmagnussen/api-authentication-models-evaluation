```typescript
import Anthropic from "@anthropic-ai/sdk";
import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const client = new Anthropic();

interface AuthRequest extends Request {
  user?: jwt.JwtPayload;
}

interface JWTConfig {
  issuer: string;
  audience: string;
  algorithm: "HS256" | "HS384" | "HS512" | "RS256" | "RS384" | "RS512";
  expirySeconds: number;
  secret: string;
}

interface TokenPayload {
  sub: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}

const DEFAULT_CONFIG: JWTConfig = {
  issuer: "secure-app",
  audience: "api-consumers",
  algorithm: "HS256",
  expirySeconds: 3600,
  secret: process.env.JWT_SECRET || "your-super-secret-key-change-this",
};

export function createSecureJWTMiddleware(config: Partial<JWTConfig> = {}) {
  const finalConfig: JWTConfig = { ...DEFAULT_CONFIG, ...config };

  // Validate configuration at middleware creation time
  if (!finalConfig.secret || finalConfig.secret.length < 32) {
    throw new Error(
      "JWT secret must be at least 32 characters long for security"
    );
  }

  if (!finalConfig.issuer || finalConfig.issuer.length === 0) {
    throw new Error("JWT issuer must be specified");
  }

  if (!finalConfig.audience || finalConfig.audience.length === 0) {
    throw new Error("JWT audience must be specified");
  }

  if (finalConfig.expirySeconds < 60) {
    throw new Error("JWT expiry must be at least 60 seconds");
  }

  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({
          error: "Missing or invalid authorization header",
          details: "Expected format: Authorization: Bearer <token>",
        });
        return;
      }

      const token = authHeader.substring(7);

      // Verify token with strict options
      const decoded = jwt.verify(token, finalConfig.secret, {
        algorithms: [finalConfig.algorithm],
        issuer: finalConfig.issuer,
        audience: finalConfig.audience,
        clockTolerance: 5, // 5 second tolerance for clock skew
      }) as jwt.JwtPayload;

      // Additional validation checks
      if (!decoded.sub) {
        res.status(401).json({ error: "Invalid token: missing subject claim" });
        return;
      }

      // Ensure token hasn't expired (jwt.verify should handle this, but explicit check)
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        res.status(401).json({ error: "Token has expired" });
        return;
      }

      req.user = decoded;
      next();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          error: "Invalid token",
          details: error.message,
        });
      } else if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          error: